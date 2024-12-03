"use client"
import { createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { redirect } from "next/navigation"
import { gql, useQuery } from '@apollo/client'

import Headers from './Headers'
import Error from './Error'
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
            <ProfileProvider>
                <Headers />
                <Auth />
                {children}
            </ProfileProvider>
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

const GET_PROFILE = gql`
  query GetProfile {
    profile {
      email
      admin
      code
    }
  }`

const profileContext = createContext<{email:string,admin:boolean,code:string}|null>(null)

function ProfileProvider({children}:{
    children: React.ReactNode
}) {
    const { data, error } = useQuery(GET_PROFILE)
    if (error) return <Error error={data.error} />

    return <profileContext.Provider value={data && data.profile || null}>
        {children}
    </profileContext.Provider>
}

export function useProfile() {
    return useContext(profileContext)
}