import type { NextRequest } from "next/server"

export type User = {
    email: string
    name: string
    picture: string
    id: string
    admin: boolean
    authorized: boolean
  }
  
export type Context = {
    req: NextRequest
    res: Response|undefined
    user?: User
  }
  
export type Profile = {
    email: string
    admin: boolean
    authorized: boolean
    codes: string[]
  }