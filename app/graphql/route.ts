import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { getToken } from "next-auth/jwt"
import databasePromise from "../db"
import type { NextRequest } from "next/server"

import { Context } from './types'
import { resolvers } from './resolvers'
import { typeDefs } from './typedefs'

const server = new ApolloServer<Context>({
  resolvers,
  typeDefs,
})

const handler = startServerAndCreateNextHandler<NextRequest,Context>(server, {
    context: async (req, res): Promise<Context> => { 
      const ctx: Context = { req, res }
      const token = await getToken({ req })
      if (!token || !token.email) return ctx // not logged in
      const db = (await databasePromise).db
      const user = await db.collection("users").findOne({ email: token.email })
      return { 
        ...ctx,
        user: {
            email: token.email,
            name: token.name || '',
            picture: token.picture || '',
            id: token.sub || '',
            admin: user?.admin || false,
            authorized: user?.authorized || false
        }
      }
    }
});

export { handler as GET, handler as POST };
