"use client"
import { useSession, signIn, signOut } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';

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
    if (session?.user) {
        return <>
        <p>signed in as {session.user.email}</p>
        <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
            onClick={() => signOut()}>sign out</button>
        </>
    } else {
        return <>
        <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
            onClick={() => signIn()}
        >accedi</button>
        </>
    }
}
