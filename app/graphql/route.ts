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
    /*
    account: async (email: string, context: any) => {
      const client = await clientPromise
      console.log("query context:", context)
      try {
        await client.connect()
        const account = client.db("coffee").collection("account")
        const result = await account.find({}).toArray()
        return result
      } catch(error) {
        console.error("Error in history function:", error)
      } finally {
        await client.close()
      }
    } */ 
  },
  Mutation: {
    coffee: async(_: any, {count}: {count: number}, context: Context) => {
      if (!context.user) throw new Error("not logged in")
      const client = await clientPromise
      console.log("mutation context:", context)
      try {
        await client.connect()
        const account = client.db("coffee").collection("account")
        const result = await account.insertOne({
          amountCents: count * 20,
          description: "coffee",
          email: context.user.email,
          timestamp: new Date()
        })
        return "ok!"
      } catch(error) {
        console.error("Error in post function:", error)
      } finally {
        await client.close()
      }
    }
  }
};

const typeDefs = gql`
  type Query {
    hello: String
#    account: [String]
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
