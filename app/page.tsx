"use client"
import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { SessionProvider } from 'next-auth/react'
import './globals.css'; // Import global styles if you have them
import { ApolloClient, ApolloError, InMemoryCache, ApolloProvider, gql, useQuery, useMutation } from '@apollo/client';

const GET_PROFILE = gql`
  query GetProfile {
    profile {
      email
      admin
    }
  }`

const GET_CREDIT = gql`
  query GetCredit {
    credit
  }`

const GET_TRANSACTIONS = gql`
  query GetTransactions {
    transactions {
      timestamp
      amountCents
      description
    }
  }`

const COFFEE = gql`
  mutation PostMutation($count: Int!) {
    coffee(count: $count)
  }`

const apolloClient = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache()
})

export default function Home() {
  return <SessionProvider>
    <ApolloProvider client={apolloClient}>
      <Auth />
      <Dashboard />
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

function Dashboard() {
  const { data: session } = useSession()

  if (!session?.user) {
    return <></>
  }

  return <main>
    <h1>dm-coffee</h1>
    <Admin />
    <CoffeeForm />
    <Credit />
    <Transactions />
  </main>
}

function CoffeeForm() {
  const [count, setCount] = useState(1)
  const [submitCoffee, coffeeMutation] = useMutation(COFFEE, {
    refetchQueries: [GET_CREDIT, GET_TRANSACTIONS]
  })

  return <form>
    <div className="grid gap-6 mb-6 md:grid-cols-1">
      <div>
        <label
          htmlFor="count"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            quanti caffé?
        </label>
        <select 
          id="count" 
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          value={count}
          onChange={e => setCount(parseInt(e.target.value))}
          >
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
          <option>6</option>
          <option>7</option>
          <option>8</option>
          <option>9</option>
          <option>10</option>
        </select>
      </div>
      <button 
        type="submit" 
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={e => submitCoffee({ variables: { count } })}
        disabled={coffeeMutation.loading}
      >
        submit!
      </button>
    </div>
  </form>
}

function Credit() {
  const {loading, error, data} = useQuery(GET_CREDIT)
  if (loading) return <Loading />
  if (error) return <Error error={error}/>
  return <div>
    <p>bilancio: € {(data.credit / 100).toFixed(2)}</p>
  </div>

}

function Transactions() {
  const {loading, error, data} = useQuery(GET_TRANSACTIONS)

  if (loading) return <Loading />
  if (error) return <Error error={error} />

  return <table className="table-auto">
      <tbody>{data.transactions.map((transaction: any, i: number) => 
          <tr key={i}>
            <td>{(new Date(transaction.timestamp)).toLocaleDateString('it')}</td>
            <td>{(transaction.amountCents/100).toFixed(2)}</td> 
            <td>{transaction.description}</td>
          </tr>
        )}
      </tbody>
    </table>
}

function Admin() {
  const { loading, error, data } = useQuery(GET_PROFILE)
  if (loading) return <Loading /> 
  if (error) return <Error error={error} />
  if (!data.profile.admin) return <>not admin</>
  return <div>
    [WIP: admin controls]
  </div>
}

function Loading() {
  return "..."
}

function Error({error}:{
  error: ApolloError
}) {
  return <div>
    Error: {error.message}
  </div>
}

function Messages({messages, setMessages}:{
  messages: string[],
  setMessages: (messages: string[]) => void
}) {
  return <>
    {messages.map((message, i) => <p key={i}>{message}</p>)}
  </>
}