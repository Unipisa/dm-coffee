"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import './globals.css'; // Import global styles if you have them
import { gql, useQuery, useMutation } from '@apollo/client';

import Provider from './components/provider'
import Credit from './components/credit'
import Loading from './components/loading'
import Error from './components/error'
import Balance from './components/balance'
import Transactions from './components/transactions'

const GET_PROFILE = gql`
  query GetProfile {
    profile {
      email
      admin
    }
  }`

const COFFEE = gql`
  mutation PostMutation($count: Int!) {
    coffee(count: $count)
  }`

export default function Home() {
  return <Provider>
      <Dashboard />
  </Provider>
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
    <Balance />
    <Transactions />
  </main>
}

function CoffeeForm() {
  const [count, setCount] = useState(1)
  const [submitCoffee, coffeeMutation] = useMutation(COFFEE, {
    refetchQueries: ["GetCredit", "GetMyTransactions", "GetBalance"]
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

function Admin() {
  const { loading, error, data } = useQuery(GET_PROFILE)
  if (loading) return <Loading /> 
  if (error) return <Error error={error} />
  if (!data.profile.admin) return <>not admin</>
  return <div>
    Accedi alla <a href="admin">pagina di amministrazione</a>
  </div>
}

