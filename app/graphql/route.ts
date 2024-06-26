import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { getToken } from "next-auth/jwt"
import databasePromise from "../db"
import { NextApiRequest, NextApiResponse } from 'next'

import config from '../config'

type Context = {
  req: NextApiRequest
  res: NextApiResponse
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
  }

  type Transaction {
    amountCents: Int
    description: String
    email: String
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
  }

  type Mutation {
    coffee(count: Int!): Boolean
  }
`

const resolvers = {
  Query: {

    profile: async(_: any, __: {}, context: Context) => {
      if (!context.user) return 
      return {
        email: context.user.email,
        admin: config.ADMINS.split(',').includes(context.user.email)
      }
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
    }

  },

  Mutation: {

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

const handler = startServerAndCreateNextHandler<NextApiRequest,Context>(server, {
    context: async (req, res) => { 
      const token = await getToken({ req })
      let ctx: Context = { req, res }
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
