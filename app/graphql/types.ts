import type { NextRequest } from "next/server"

export type User = {
    email: string
    name: string
    picture: string
    id: string
    admin: boolean
  }
  
export  type Context = {
    req: NextRequest
    res: Response|undefined
    user?: User
  }
  
