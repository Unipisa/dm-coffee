"use client"
import { useSession } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { redirect } from "next/navigation"

import Headers from './Headers'
import '../globals.css'; // Import global styles if you have them

const apolloClient = new ApolloClient({
    uri: '/graphql',
    cache: new InMemoryCache()
  })
  
export default function Provider({children}:{
    children: React.ReactNode
}) {
    return <SessionProvider>
        <ApolloProvider client={apolloClient}>
        <Auth />
        {children}
        </ApolloProvider>
    </SessionProvider>
}

function Auth() {
    const { data: session } = useSession()
    if (session === undefined) return <div className="text-center">
            ☕
        </div>
    if (!session?.user) return redirect('/api/auth/signin')
    return null
}



