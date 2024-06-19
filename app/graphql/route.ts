import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { gql } from 'graphql-tag'

import clientPromise from "../db"

const resolvers = {
  Query: {
    hello: () => 'world',
  },
  Mutation: {
    post: async(_: any, {code, count}: any) => {
      const client = await clientPromise
      try {
        await client.connect()
        const account = client.db("coffee").collection("account")
        const result = await account.insertOne({
          code,
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
    post(code: String!, count: Int!): String
  }
`;

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

const handler = startServerAndCreateNextHandler(server, {
    context: async (req, res) => ({ req, res, user: null }),
});
/*
startServerAndCreateNextHandler(server, {
  context: async (req, res) => ({ req, res, user: await getLoggedInUser(req) }),
});
*/

export { handler as GET, handler as POST };
