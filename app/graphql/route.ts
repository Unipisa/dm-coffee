import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'
import { getToken } from "next-auth/jwt"
import clientPromise from "../db"
import { NextApiRequest, NextApiResponse } from 'next'

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

const resolvers = {
  Query: {
    hello: () => 'world',
    credit: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const client = await clientPromise
      const account = client.db("coffee").collection("account")
      const result = await account.aggregate([
        { $match: { email: context.user.email } },
        { $group: { _id: null, creditCents: { $sum: "$amountCents" } } }
      ]).toArray()
      if (result.length === 0) return {error: "no account found", balance: 0}
      return result[0].creditCents
    },
    transactions: async(_: any, __: {}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const client = await clientPromise
      const account = client.db("coffee").collection("account")
      const result = await account.find({ email: context.user.email }).toArray()
      return result
    }
  },
  Mutation: {
    coffee: async(_: any, {count}: {count: number}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const client = await clientPromise
      console.log("mutation context:", context)
      const account = client.db("coffee").collection("account")
      const result = await account.insertOne({
        amountCents: -count * 20,
        description: "coffee",
        email: context.user.email,
        timestamp: new Date()
      })
      return "ok!"
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

const typeDefs = gql`
  scalar Timestamp

  type Transaction {
    amountCents: Int
    description: String
    email: String
    timestamp: Timestamp
  }

  type Query {
    hello: String
    credit: Int
    transactions: [Transaction]
  }
  type Mutation {
    coffee(count: Int!): String
  }
`;

const server = new ApolloServer<Context>({
  resolvers,
  typeDefs,
});

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
