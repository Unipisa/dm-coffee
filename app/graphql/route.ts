import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'

import clientPromise from "../db"

const resolvers = {
  Query: {
    hello: () => 'world',
  },
  Mutation: {
    post: async(_: any, {count}: any, context: any) => {
      const client = await clientPromise
      console.log("mutation context:", context)
      try {
        await client.connect()
        const account = client.db("coffee").collection("account")
        const result = await account.insertOne({
          count,
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
  }
  type Mutation {
    post(count: Int!): String
  }
`;

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

const handler = startServerAndCreateNextHandler(server, {
    context: async (req, res) => { 
      console.log("context:", req, res)
      return { req, res, user: null }
    }
});

export { handler as GET, handler as POST };
