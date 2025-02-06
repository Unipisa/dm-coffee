import databasePromise from "../db"
import { ObjectId } from 'mongodb'

import { Context } from './types'
import { requireAdminUser, requireAuthenticatedUser, requirePermittedUser, requireCardAuthentication } from './permissions'

export const resolvers = {
    Query: {
      cost: async(_: any, __: {}, context: Context) => {
        return await getCost()
      },
  
      costHistory: async(_: any, __: {}, context: Context) => {
        const db = (await databasePromise).db
        const cost = db.collection("cost")
        const result = await cost.find({}, { sort: { timestamp: -1 } }).toArray()
        return result
      },
  
      profile: async(_: any, __: {}, context: Context) => {
        if (!context.user) return 
        const users = (await databasePromise).db.collection('users')
        const user = await users.findOne({email: context.user.email})
        return {...user}
      },
  
      credit: async(_: any, __: {}, context: Context) => {
        const user = requireAuthenticatedUser(context)
        const db = (await databasePromise).db
        const account = db.collection("account")
        const result = await account.aggregate([
          { $match: { email: user.email } },
          { $group: { 
            _id: null, 
            creditCents: { $sum: "$amountCents" },
            count: { $sum: "$count" },
            coffeeGrams: { $sum: "$coffeeGrams" },
          } }
        ]).toArray()
        if (result.length === 0) return 0
        return {
          cents: result[0].creditCents, 
          count: result[0].count,
          grams: result[0].coffeeGrams
        }
      },
  
      balance: async(_: any, __: {}, context: Context) => {
        const db = (await databasePromise).db
        const account = db.collection("account")
        const result = await account.aggregate([
          { $group: { 
            _id: null, 
            cents: { $sum: "$amountCents" },
            count: { $sum: "$count" },
            grams: { $sum: "$coffeeGrams" },
          } }
        ]).toArray()
        if (result.length === 0) return 0
        return {
          cents: result[0].cents,
          count: result[0].count,
          grams: result[0].grams
        }
      },
  
      myTransactions: async(_: any, __: {}, context: Context) => {
        const user = requireAuthenticatedUser(context)
        const db = (await databasePromise).db
        const account = db.collection("account")
        const result = await account
          .find({ email: user.email })
          .sort({ timestamp: -1 })
          .toArray()
        return result
      },
  
      transactionYears: async(_: any, __: {}, context: Context) => {
        requireAuthenticatedUser(context)
        const db = (await databasePromise).db
        const account = db.collection("account")
        const result = await account.aggregate([
          { $group: { 
            _id: { $year: "$timestamp" },
          }},
          { $sort: { _id: -1 } },
          { $project: { _id: 0, year: "$_id" } }
        ]).toArray()
        return result.map(x => x.year)
      },
  
      transactions: async(_: any, {year} : {year?: number}, context: Context) => {
        const user = requireAdminUser(context)
  
        const db = (await databasePromise).db
        const account = db.collection("account")
  
         // Build the query object
        const query: Record<string, any> = {};
        if (year) {
          query.timestamp = {
            $gte: new Date(`${year}-01-01T00:00:00Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00Z`),
          };
        }
  
        const result = await account
          .find(query)
          .sort({ timestamp: -1 })
          .toArray();
  
        return result
      },
  
      userTransactions: async(_: any, __: {}, context: Context) => {
        requireAdminUser(context)
  
        const db = (await databasePromise).db
        const result = await db.collection("account").aggregate([
          { $group: { 
            _id: "$email", 
            creditCents: { $sum: "$amountCents" },
            count: { $sum: "$count" },
            coffeeGrams: { $sum: "$coffeeGrams" },
            timestamp: { $max: "$timestamp" },
          }},
          { $project: { _id: 0, email: "$_id", creditCents: 1, count: 1, coffeeGrams: 1, timestamp: 1 } },
          { $sort: { email: 1 } },
        ]).toArray()
        // console.log(JSON.stringify(result))
        return result
      },

      users: async(_: any,__: {}, context: Context) => {
        requireAdminUser(context)
        const db = (await databasePromise).db
        const users = db.collection("users")
        const result = await users.find({}).toArray()
        return result
      },
            
      notices: async(_: any, __: {}, context: Context) => {
        const user = requireAuthenticatedUser(context)
  
        const db = (await databasePromise).db
        const result = await db.collection("notices").find({
            solved: false
          }, { sort: { timestamp: -1 }
        }).toArray()
        return result
      },
    },
  
    Mutation: {
      setCost: async(_: any, {cents}: {cents: number}, context: Context) => {
        requireAdminUser(context)
        const db = (await databasePromise).db
        const cost = db.collection("cost")
        await cost.insertOne({ timestamp: new Date(), cents })
        return true
      },
  
      card_request_pairing: async(_: any, __: {}, context: Context) => {
        const user = requirePermittedUser(context)
        const db = (await databasePromise).db
        const users = db.collection("users")
        const MILLISECONDS = 1000*60
        const timestamp = new Date(new Date().getTime() + MILLISECONDS)
        await users.updateOne({ email: user.email },
          { $set: { scan_request_limit_timestamp: timestamp } })
        return MILLISECONDS
      },
  
      card_remove_pairing: async(_: any, __: {}, context: Context) => {
        const user = requireAuthenticatedUser(context)
        const users = (await databasePromise).db.collection("users")
        await users.updateOne({email: user.email},
          { $set: { code: null }})
        return true 
      },
  
      card: async(_: any, {code}: {code: string}, context: Context) => {
        requireCardAuthentication(context)
        const db = (await databasePromise).db
        const users = db.collection("users")
        const user = await users.findOne({ code })
        if (user) {
          /**
           * ATTENZIONE: un utente che e' riuscito a collegare la tessera
           * e' autorizzato anche se il suo email non corrisponde alla
           * lista degli utenti autorizzati.
           * Questo dovrebbe andare bene perché l'utente non può collegare la tessera
           * se non è autorizzato.
           */
          const COST = await getCost()
          const transactions = db.collection("account")
          const email = user.email
          const description = "coffee"
          const timestamp = new Date()
          const amountCents = -COST
          const count = 1

          const existingTransaction = await transactions.findOne({
            email, code, description,
            timestamp: { $gte: new Date(timestamp.getTime() - 30000) }
          });

          const last_count = existingTransaction ? existingTransaction.count : 0

          if (existingTransaction) {
            await transactions.updateOne(
              { _id: existingTransaction._id },
              { $inc: { 
                count, 
                amountCents
              } }
            );
          } else {
            await transactions.insertOne({
              count,
              email,
              amountCents,
              description,
              code,
              timestamp
            });
          }
          const result = await transactions.aggregate([
            { $match: { email: user.email } },
            { $group: { _id: null, creditCents: { $sum: "$amountCents" } } }
          ]).toArray()
          const credit = result.length > 0 ? result[0].creditCents : 0
          return [ last_count ? `${COST}x${last_count+1} cents charged` : `${COST} cents charged`, `Balance:  ${(credit/100).toFixed(2)} EUR`, `${user.email.split('@')[0]}`].join('\n')
        } else {
          const CARD_PAIRING_MILLISECONDS = 1000*60
          // cerca utenti che hanno chiesto l'accoppiamento della tessera
          const pairings = await db.collection("users").aggregate([
            { $match: { scan_request_limit_timestamp: { $gt: new Date(new Date().getTime() - CARD_PAIRING_MILLISECONDS) } } }
          ]).toArray()
          if (pairings.length === 0) {
            return ["X Unknown badge!", "Go to the website:", " coffee.dm.unipi.it"].join('\n') 
          } else if (!code) {
            return ["invalid badge"].join('\n')
          } else if (pairings.length === 1) {
            await users.updateOne({ _id: pairings[0]._id }, 
              { $set: { 
                scan_request_limit_timestamp: null,
                code
              } })
            return ["badge paired","swipe again to charge"].join('\n')
          } else {
            return ["multiple badges waiting","pairing failed"].join('\n')
          }
        }
      },
  
      coffee: async(_: any, {count}: {count: number}, context: Context) => {
        const user = requirePermittedUser(context)
        const db = (await databasePromise).db
        console.log("mutation context:", context)
        const account = db.collection("account")
        const COST = await getCost()
        const result = await account.insertOne({
          count: count,
          amountCents: -count * COST,
          description: "coffee",
          email: user.email,
          timestamp: new Date()
        })
        return true
      },
  
      transaction: async(_: any, { _id, timestamp, email, count, amountCents, coffeeGrams, description }: { 
          _id: string, timestamp: string, email: string, 
          count: number, amountCents: number, coffeeGrams: number,
          description: string }, context: Context) => {
        requireAdminUser(context)
  
        const db = (await databasePromise).db
        const account = db.collection("account")
        const data = {
          timestamp: timestamp ? new Date(timestamp) : new Date(), 
          email, count, amountCents, coffeeGrams, description 
        }
        console.log(`making transaction: ${JSON.stringify(data)}}`)
        if (_id) {
          await account.updateOne({ _id: new ObjectId(_id) }, 
            { $set: data })
        } else {
          await account.insertOne(data)
        }
        return true
      },
  
      createNotice: async(_: any, {message}: {message: string}, context: Context) => {
        const user = requirePermittedUser(context)
        const isAdmin = user.admin
        const USER_MESSAGES = ["fine grani"]
        if (!isAdmin && !USER_MESSAGES.includes(message)) {
          throw new Error(`not authorized to create notice with message: "${message}". Available messages: ${USER_MESSAGES.map(s=>`"${s}"`).join(', ')}`)
        }
        const db = (await databasePromise).db
        const notices = db.collection("notices")
        const result = await notices.insertOne({
          timestamp: new Date(),
          message,
          solved: false,
          email: user.email
        })
        return true
      },
  
      solveNotice: async(_: any, {_id}: {_id: string}, context: Context) => {
        requireAdminUser(context)
        const db = (await databasePromise).db
        const notices = db.collection("notices")
        const result = await notices.updateOne({ _id: new ObjectId(_id) }, 
          { $set: { solved: true } })
        return true
      },
  
      updateUser: async(_:any, { _id, data }: { _id: string, data: { admin: boolean, authorized: boolean } }, context: Context) => {
        requireAdminUser(context)
        const db = (await databasePromise).db
        const users = db.collection("users")
        console.log(`updating user: ${_id} with data: ${JSON.stringify(data)}`)
        const result = await users.updateOne({ _id: new ObjectId(_id) }, 
          { $set: data })
        return true
      }
    },
  
    Timestamp: {
      parseValue(value: number) {
        return new Date(value)
      },
      serialize(value: Date) {
        return value.toISOString()
      },
      parseLiteral(ast: any) {
        if (ast.kind === 'StringValue') {
          return new Date(ast.value)
        }
        return null
      }
    }
  }

async function getCost(): Promise<number> {
    const db = (await databasePromise).db
    const cost = db.collection("cost")
    const result = await cost.findOne({}, { sort: { timestamp: -1 } })
    return result ? result.cents : 20
  }
  