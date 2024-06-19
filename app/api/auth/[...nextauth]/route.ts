import NextAuth, {User, Account, Profile} from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"

import clientPromise from "../../../db"
import config from "../../../config"

const { 
  GOOGLE_AUTH_CLIENT_ID, 
  GOOGLE_AUTH_CLIENT_SECRET,
  DATABASE_URI,
  DATABASE_NAME,
} = config


const handler = NextAuth({
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
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: DATABASE_NAME,
  })
})

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
  return lst
}