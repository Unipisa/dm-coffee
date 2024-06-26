import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { getToken } from "next-auth/jwt"
import databasePromise from "../db"
import { NextApiRequest, NextApiResponse } from 'next'
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

  type Transaction {
    _id: String
    amountCents: Int
    description: String
    email: String
    code: String
    timestamp: Timestamp
  }

  type User {
    email: String
    creditCents: Int
    timestamp: Timestamp
  }

  type Query {
    profile: Profile
    
    """
    credit of the currently logged in user (debit if negative)
    """
    credit: Int
    
    """
    total balance (all users) (debit if negative)
    """
    balance: Int
    
    """
    transactions of the currently logged in user
    """
    myTransactions: [Transaction]

    """
    all transactions
    """
    transactions: [Transaction]

    """
    users and their credit
    """
    users: [User]
  }

  type Mutation {
    """
    addebita $count caffé
    richiede autenticazione
    """
    coffee(count: Int!): Boolean

    """
    crea o modifica una transazione
    richiede autenticazione admin
    """
    transaction(_id: String, email: String, amountCents: Int, description: String): Boolean

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
  }
`
const resolvers = {
  Query: {

    profile: async(_: any, __: {}, context: Context) => {
      if (!context.user) return 
      const users = (await databasePromise).db.collection('users')
      const user = await users.findOne({email: context.user.email})
      return user
    },

    credit: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account.aggregate([
        { $match: { email: context.user.email } },
        { $group: { _id: null, creditCents: { $sum: "$amountCents" } } }
      ]).toArray()
      if (result.length === 0) return 0
      return result[0].creditCents
    },

    balance: async(_: any, __: {}, context: Context) => {
      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account.aggregate([
        { $group: { _id: null, balanceCents: { $sum: "$amountCents" } } }
      ]).toArray()
      if (result.length === 0) return 0
      return result[0].balanceCents
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

    transactions: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      if (!config.ADMINS.split(',').includes(context.user.email)) throw new Error("not admin")

      const db = (await databasePromise).db
      const account = db.collection("account")
      const result = await account
        .find({})
        .sort({ timestamp: -1 })
        .toArray()
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
          timestamp: { $max: "$timestamp" },
        }},
        { $project: { _id: 0, email: "$_id", creditCents: 1, timestamp: 1 } },
        { $sort: { email: 1 } }
      ]).toArray()
      console.log("users:", result)
      return result
    }

  },

  Mutation: {
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
      if (!authorization || Array.isArray(authorization) || !config.SECRET_TOKENS.split(',').includes(authorization)) {
        throw new Error("not authorized")
      }
      const db = (await databasePromise).db
      const users = db.collection("users")
      const user = await users.findOne({ code })
      if (user) {
        const transactions = db.collection("account")
        const COST = 20
        await transactions.insertOne({
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
      const result = await account.insertOne({
        amountCents: -count * 20,
        description: "coffee",
        email: context.user.email,
        timestamp: new Date()
      })
      return true
    },

    transaction: async(_: any, { _id, email, amountCents, description }: { _id: string, email: string, amountCents: number, description: string }, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      if (!config.ADMINS.split(',').includes(context.user.email)) throw new Error("not admin")

      const db = (await databasePromise).db
      const account = db.collection("account")
      if (_id) {
        await account.updateOne({ _id: new ObjectId(_id) }, 
          { $set: { email, amountCents, description } })
      } else {
        await account.insertOne({ email, amountCents, description, timestamp: new Date() })
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

export { handler as GET, handler as POST };
