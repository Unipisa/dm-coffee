import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { getToken } from "next-auth/jwt"
import databasePromise from "../db"
import type { NextRequest } from "next/server"
import { ObjectId } from 'mongodb'

import config from '../config'
import { isPermittedEmail } from '../utils'

type User = {
  email: string
  name: string
  picture: string
  id: string
}

type UserWithAdminField = User & { admin: boolean }

type Context = {
  req: NextRequest
  res: Response|undefined
  user?: User
}

/**
 * @param context 
 * @returns user object if authenticated 
 * @throws error if not authenticated
 */
function requireAuthenticatedUser(context: Context): UserWithAdminField {
  const user = context?.user
  if (!user) throw new Error("not logged in")
  return {
    ...user,
    admin: config.ADMINS.split(',').includes(user.email)
  }
}

/**
 * @param context 
 * @returns user object if authenticated and email is permitted by configuration
 * @throws error if not authenticated or email is not permitted
 */
function requirePermittedUser(context: Context): UserWithAdminField {
  const user = requireAuthenticatedUser(context)
  if (!isPermittedEmail(user?.email)) throw new Error("email not permitted")
  return user
}

/**
 * @param context 
 * @returns user object if authenticated and email is in the list of admins
 * @throws error if not authenticated or email is not in the list of admins
 */
function requireAdminUser(context: Context): User {
  const authorization = context.req.headers.get('authorization')
  if (authorization && !Array.isArray(authorization) && config.ADMIN_SECRET_TOKENS.split(',').includes(authorization)) {
    return { email: 'admin', name: 'request with authorization token', picture: '', id: 'unknown_admin' }
  }

  const user = requireAuthenticatedUser(context)
  if (!user.admin) throw new Error("not admin")
  return user
}

function requireCardAuthentication(context: Context): User {
  const authorization = context.req.headers.get('authorization')
  if (authorization && !Array.isArray(authorization) && config.CARD_SECRET_TOKENS.split(',').includes(authorization)) {
    return { email: 'card', name: 'request with authorization token', picture: '', id: 'unknown_card' }
  }
  throw new Error("not card user")
}


const typeDefs = gql`
  scalar Timestamp

  type Profile {
    email: String
    admin: Boolean
    authorized: Boolean
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

  type Notice {
    _id: String
    timestamp: Timestamp
    message: String
    solved: Boolean
    email: String
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

    """
    notices
    """
    notices: [Notice]
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

    """
    crea una segnalazione
    """
    createNotice(message: String!): Boolean

    """
    risolvi una segnalazione
    """
    solveNotice(_id: String!): Boolean
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
      const admin = config.ADMINS.split(',').includes(context.user.email)
      const authorized = isPermittedEmail(context.user.email)
      return {...user, admin, authorized}
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
      const user = requireAuthenticatedUser(context)
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

    users: async(_: any, __: {}, context: Context) => {
      const user = requireAdminUser(context)

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
        return [ `${COST} cents charged`, `Balance:  ${(credit/100).toFixed(2)} EUR`, `${user.email.split('@')[0]}`].join('\n')
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

    transaction: async(_: any, { _id, timestamp, email, count, amountCents, description }: { _id: string, timestamp: string, email: string, count: number, amountCents: number, description: string }, context: Context) => {
      requireAdminUser(context)

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
