import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';

const resolvers = {
  Query: {
    hello: () => 'world',
  },
  Mutation: {
    post: async(_: any, {code, count}: any) => {
      return "good!"
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
