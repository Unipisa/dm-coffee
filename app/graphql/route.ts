import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { getToken } from "next-auth/jwt"
import databasePromise from "../db"
import type { NextRequest } from "next/server"
import { ObjectId } from 'mongodb'

import config from '../config'

type Context = {
  req: NextRequest
  res: Response|undefined
  user?: {
    email: string
    name: string
    picture: string
    id: string
  }
}

const typeDefs = gql`
  scalar Timestamp

  type Profile {
    email: String
    admin: Boolean
    code: String
  }

  type Cost {
    timestamp: Timestamp
    cents: Int
  }

  type Transaction {
    _id: String
    count: Int
    amountCents: Int
    description: String
    email: String
    code: String
    timestamp: Timestamp
  }

  type User {
    email: String
    creditCents: Int
    count: Int
    timestamp: Timestamp
  }

  type Balance {
    cents: Int
    count: Int  
  }

  type Query {
    profile: Profile
    
    """
    cost of a coffee
    """
    cost: Int

    """
    cost of a coffee (history)
    """
    costHistory: [Cost]

    """
    credit of the currently logged in user (debit if negative)
    """
    credit: Balance
    
    """
    total balance (all users) (debit if negative)
    """
    balance: Balance
    
    """
    transactions of the currently logged in user
    """
    myTransactions: [Transaction]

    """
    all transactions
    """
    transactions(year: Int): [Transaction]

    """
    years with transaction
    """
    transactionYears: [Int]

    """
    users and their credit
    """
    users: [User]
  }

  type Mutation {
    """
    modificare il costo di un caffé
    richiede autenticazione admin
    """
    setCost(cents: Int!): Boolean    

    """
    addebita $count caffé
    richiede autenticazione
    """
    coffee(count: Int!): Boolean

    """
    crea o modifica una transazione
    richiede autenticazione admin
    """
    transaction(_id: String, timestamp: String, email: String, count: Int, amountCents: Int, description: String): Boolean

    """
    addebita un caffé
    richiede token di autenticazione
    """
    card(code: String!): String

    """
    request a card pairing
    returns the time in milliseconds after which the card will be unpaired
    requires authentication
    """
    card_request_pairing: Int

    """
    remove card pairing
    """
    card_remove_pairing: Boolean
  }`

const resolvers = {
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
      if (config.ADMINS.split(',').includes(context.user.email)) {
        return { ...user, admin: true}
      } else {
        return {...user}
      }
    },

    credit: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account.aggregate([
        { $match: { email: context.user.email } },
        { $group: { 
          _id: null, 
          creditCents: { $sum: "$amountCents" },
          count: { $sum: "$count" },
        } }
      ]).toArray()
      if (result.length === 0) return 0
      return {cents: result[0].creditCents, count: result[0].count}
    },

    balance: async(_: any, __: {}, context: Context) => {
      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account.aggregate([
        { $group: { 
          _id: null, 
          cents: { $sum: "$amountCents" },
          count: { $sum: "$count" },
        } }
      ]).toArray()
      if (result.length === 0) return 0
      return {
        cents: result[0].cents,
        count: result[0].count
      }
    },

    myTransactions: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account
        .find({ email: context.user.email })
        .sort({ timestamp: -1 })
        .toArray()
      return result
    },

    transactionYears: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account.aggregate([
        { $group: { 
          _id: { $year: "$timestamp" },
        }},
        { $project: { _id: 0, year: "$_id" } }
      ]).toArray()
      return result.map(x => x.year)
    },

    transactions: async(_: any, {year} : {year?: number}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      if (!config.ADMINS.split(',').includes(context.user.email)) throw new Error("not admin")

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

    users: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      if (!config.ADMINS.split(',').includes(context.user.email)) throw new Error("not admin")

      const db = (await databasePromise).db
      const result = await db.collection("account").aggregate([
        { $group: { 
          _id: "$email", 
          creditCents: { $sum: "$amountCents" },
          count: { $sum: "$count" },
          timestamp: { $max: "$timestamp" },
        }},
        { $project: { _id: 0, email: "$_id", creditCents: 1, count: 1, timestamp: 1 } },
        { $sort: { email: 1 } }
      ]).toArray()
      // console.log("users:", result)
      return result
    }

  },

  Mutation: {
    setCost: async(_: any, {cents}: {cents: number}, context: Context) => {
      // check if authorization bearer token is valid
      const authorization = context.req.headers.get('authorization')

      if (!context.user?.email || !config.ADMINS.split(',').includes(context.user.email)) {
        console.log("invalid authorization", authorization)
        // no token provided, check credentials
        if (!context.user) throw new Error("not logged in")
        throw new Error("not admin")
      }

      const db = (await databasePromise).db
      const cost = db.collection("cost")
      await cost.insertOne({ timestamp: new Date(), cents })
      return true
    },

    card_request_pairing: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const db = (await databasePromise).db
      const users = db.collection("users")
      const MILLISECONDS = 1000*60
      const timestamp = new Date(new Date().getTime() + MILLISECONDS)
      await users.updateOne({ email: context.user.email },
        { $set: { scan_request_limit_timestamp: timestamp } })
      return MILLISECONDS
    },

    card_remove_pairing: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const users = (await databasePromise).db.collection("users")
      await users.updateOne({email: context.user.email},
        { $set: { code: null }})
      return true 
    },

    card: async(_: any, {code}: {code: string}, context: Context) => {
      const authorization = context.req.headers.get('authorization')

      // check if authorization bearer token is valid
      if (!authorization || Array.isArray(authorization) || !config.CARD_SECRET_TOKENS.split(',').includes(authorization)) {
        throw new Error("not authorized")
      }
      const db = (await databasePromise).db
      const users = db.collection("users")
      const user = await users.findOne({ code })
      if (user) {
        const COST = await getCost()
        const transactions = db.collection("account")
        await transactions.insertOne({
          count: 1,
          email: user.email,
          amountCents: -COST,
          description: `coffee`,
          code: code,
          timestamp: new Date()
        })        
        const result = await transactions.aggregate([
          { $match: { email: user.email } },
          { $group: { _id: null, creditCents: { $sum: "$amountCents" } } }
        ]).toArray()
        const credit = result.length > 0 ? result[0].creditCents : 0
        return [`addebitati ${COST} centesimi`, `${user.email.split('@')[0]}: ${(credit/100).toFixed(2)}€`].join('\n')
      } else {
        const CARD_PAIRING_MILLISECONDS = 1000*60
        // cerca utenti che hanno chiesto l'accoppiamento della tessera
        const pairings = await db.collection("users").aggregate([
          { $match: { scan_request_limit_timestamp: { $gt: new Date(new Date().getTime() - CARD_PAIRING_MILLISECONDS) } } }
        ]).toArray()
        if (pairings.length === 0) {
          return ["tessera sconosciuta","apri coffee.dm.unipi.it"].join('\n') 
        } else if (!code) {
          return ["tessera non valida"].join('\n')
        } else if (pairings.length === 1) {
          await users.updateOne({ _id: pairings[0]._id }, 
            { $set: { 
              scan_request_limit_timestamp: null,
              code
            } })
          return ["tessera accoppiata!","passa nuovamente per addebitare"].join('\n')
        } else {
          return ["più tessere in attesa","accoppiamento fallito"].join('\n')
        }
      }
    },

    coffee: async(_: any, {count}: {count: number}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const db = (await databasePromise).db
      console.log("mutation context:", context)
      const account = db.collection("account")
      const COST = await getCost()
      const result = await account.insertOne({
        count: count,
        amountCents: -count * COST,
        description: "coffee",
        email: context.user.email,
        timestamp: new Date()
      })
      return true
    },

    transaction: async(_: any, { _id, timestamp, email, count, amountCents, description }: { _id: string, timestamp: string, email: string, count: number, amountCents: number, description: string }, context: Context) => {
      // check if authorization bearer token is valid
      const authorization = context.req.headers.get('authorization')

      if (!authorization || Array.isArray(authorization) || !config.ADMIN_SECRET_TOKENS.split(',').includes(authorization)) {
        console.log("invalid authorization", authorization)
        // no token provided, check credentials
        if (!context.user) throw new Error("not logged in")
        if (!config.ADMINS.split(',').includes(context.user.email)) throw new Error("not admin")
      }

      const db = (await databasePromise).db
      const account = db.collection("account")
      const data = {
        timestamp: timestamp ? new Date(timestamp) : new Date(), 
        email, count, amountCents, description 
      }
      console.log(`making transaction: ${JSON.stringify(data)}}`)
      if (_id) {
        await account.updateOne({ _id: new ObjectId(_id) }, 
          { $set: data })
      } else {
        await account.insertOne(data)
      }
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

const server = new ApolloServer<Context>({
  resolvers,
  typeDefs,
})

const handler = startServerAndCreateNextHandler<NextRequest,Context>(server, {
    context: async (req, res): Promise<Context> => { 
      const ctx: Context = { req, res }
      const token = await getToken({ req })
      if (!token || !token.email) return ctx // not logged in
      return { 
        ...ctx,
        user: {
            email: token.email,
            name: token.name || '',
            picture: token.picture || '',
            id: token.sub || '',
        }
      }
    }
});

async function getCost(): Promise<number> {
  const db = (await databasePromise).db
  const cost = db.collection("cost")
  const result = await cost.findOne({}, { sort: { timestamp: -1 } })
  return result ? result.cents : 20
}

export { handler as GET, handler as POST };
