import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic' // defaults to auto

export async function POST(request: Request) {
    const body = await request.json()
    console.log(body)
    return NextResponse.json({ok: true})
}