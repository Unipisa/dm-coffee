// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { Db, MongoClient, ServerApiVersion } from "mongodb"

import config from "./config"

const { DATABASE_URI } = config

if (!DATABASE_URI) {
  throw new Error('Invalid/Missing environment variable: "DATABASE_URI"')
}
 
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}
 
type Database = {
  client: MongoClient
  db: Db
}

let databasePromise: Promise<Database>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoDatabasePromise?: Promise<Database>
  }
 
  if (!globalWithMongo._mongoDatabasePromise) {
    globalWithMongo._mongoDatabasePromise = get_db()
  }
  databasePromise = globalWithMongo._mongoDatabasePromise
} else {
  // In production mode, it's best to not use a global variable.
  databasePromise = get_db()
}
 
// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default databasePromise

async function get_db(): Promise<Database> {  
  console.log("connecting to database", DATABASE_URI)
  const client: MongoClient = new MongoClient(DATABASE_URI, options)
  const connection = await client.connect()
  console.log("connected to database", DATABASE_URI)
  const db = connection.db('coffee')
  await initialize(db)
  return { client, db }
}

async function initialize(db: Db) {
}

