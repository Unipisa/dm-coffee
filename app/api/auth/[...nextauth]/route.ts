import NextAuth, {AuthOptions} from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"

import databasePromise from "../../../db"
import config from "../../../config"
import Credentials from "next-auth/providers/credentials"

async function getClient() {
  const { client } = await databasePromise
  return client
}

const { 
  GOOGLE_AUTH_CLIENT_ID, 
  GOOGLE_AUTH_CLIENT_SECRET,
  DATABASE_NAME,
  UNSAFE_AUTOMATIC_LOGIN_EMAIL,
} = config

const authOptions: AuthOptions = {
  providers: discoverProviders(),
  callbacks: {
    async signIn({ account, profile }) {
      console.log("signIn", account, profile)
      // return true to allow sign in
      if (account?.provider === 'google') {
        // you can inspect: profile.email_verified
        // and: profile.email
      }
      return true
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: MongoDBAdapter(getClient(), {
    databaseName: DATABASE_NAME,
  }),
  pages: {
    signIn: '/api/auth/signin',
  }
}

const handler = NextAuth(authOptions)

export {handler as GET, handler as POST}

function discoverProviders() {
  const lst = []
  if (GOOGLE_AUTH_CLIENT_ID) {
    if (!GOOGLE_AUTH_CLIENT_SECRET) throw new Error("GOOGLE_AUTH_CLIENT_SECRET is not defined")
    lst.push(GoogleProvider({
        clientId: GOOGLE_AUTH_CLIENT_ID,
        clientSecret: GOOGLE_AUTH_CLIENT_SECRET,
      }))
  } else {
    console.warn("GOOGLE_AUTH_CLIENT_ID not set, Google provider not available")
  }
  if (UNSAFE_AUTOMATIC_LOGIN_EMAIL) {
    lst.push(Credentials({
      authorize: async credentials => ({
        id: 'unsafe_automatic_login',
        email: UNSAFE_AUTOMATIC_LOGIN_EMAIL,
        admin: true,
      }),
      credentials: {}
    }))
  }
  return lst
}