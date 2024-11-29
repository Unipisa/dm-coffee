"use client"
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import './globals.css'; // Import global styles if you have them
import { gql, useQuery, useMutation, useApolloClient } from '@apollo/client';

import Button from './components/Button'
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
      code
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
    <h1>dm-coffee </h1>
    <Admin />
    <Pairing />
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
      <Button onClick={() => submitCoffee({ variables: { count } })}>
        submit!
      </Button>
    </div>
  </form>
}

function Admin() {
  const { loading, error, data } = useQuery(GET_PROFILE)
  if (loading) return <Loading /> 
  if (error) return <Error error={error} />
  if (!data.profile.admin) return <></>
  return <div>
    Accedi alla <a href="admin">pagina di amministrazione</a>
  </div>
}

const REQUEST_PAIRING = gql`
  mutation RequestPairing {
    card_request_pairing
  }`

const REMOVE_PAIRING = gql`
  mutation RemovePairing {
    card_remove_pairing
  }`

function Pairing({}) {
  const { loading, error, data } = useQuery(GET_PROFILE)
  const [ removePairing, {}] = useMutation(REMOVE_PAIRING, {refetchQueries: ["GetProfile"]}) 
  if (loading) return <Loading /> 
  if (error) return <Error error={error} />
  if (!data.profile) return <></>
  if (data.profile.code) {
    return <div>Hai associato la tessera {data.profile.code}. <Button variant="alert" onClick={removePairing}>disaccoppia!</Button></div>
  } else return <PairingRequest />
}

function PairingRequest({}) {
  const [submitPairing, {loading, error, data}] = useMutation(REQUEST_PAIRING,{
    onCompleted: completed})
  const [countdown, setCountdown] = useState(0)
  const client = useApolloClient()
  if (loading) return <Loading />
  if (error) return <Error error={error} />
  if (countdown > 0) {
    return <p>Passa la tessera sul lettore entro <b>{countdown}</b> secondi!</p>
  }
  return <>
    <p>Non hai associato nessuna tessera.</p>
    <p>Se hai una tessera e sei in sala caffé premi il pulsante {}
    <Button onClick={() => submitPairing()}>
      associazione tessera
    </Button> 
    </p>
  </>

  function completed(data: {card_request_pairing: number}) {
    const milliseconds = data.card_request_pairing
    console.log(`milliseconds: ${milliseconds}`)
    setCountdown(Math.round(milliseconds/1000))
    const id = setInterval(() => {
      setCountdown(c => c - 1)
      client.refetchQueries({ include: ["GetProfile"] })
    }, 1000)
    setTimeout(() => {
      clearInterval(id),
      setCountdown(0)
    }, milliseconds)
  }
}