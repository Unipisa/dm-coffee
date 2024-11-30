"use client"
import { useQuery, gql, useMutation } from '@apollo/client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

import Provider from '../components/provider'
import Balance from '../components/balance'
import Loading from '../components/loading'
import Error from '../components/error'
import Headers from '../components/Headers'

export default function Admin({}) {
    return <Provider>
        <Headers />
        Vai alla <a href='/admin/import'>pagina di importazione</a>
        <Balance />
        <Transactions />
        <Users />
    </Provider>
}

const GET_TRANSACTIONS = gql`
  query GetTransactions {
    transactions {
      _id 
      timestamp
      email
      count
      amountCents
      description
    }
  }`

type Transaction = {
  _id: string,
  timestamp: string,
  email: string,
  count: number,
  amountCents: number,
  description: string
}

function Transactions() {
    const {loading, error, data} = useQuery(GET_TRANSACTIONS)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <table>
        <tbody>
          <TransactionRow />
          {data.transactions.map((transaction: Transaction) => 
            <TransactionRow key={transaction._id} transaction={transaction} />
          )}
        </tbody>
    </table>
}

const SAVE_TRANSACTION = gql`
  mutation SaveTransaction($_id: String, $timestamp: String, $email: String, $count: Int, $amountCents: Int, $description: String) {
    transaction(_id: $_id, timestamp: $timestamp, email: $email, count: $count, amountCents: $amountCents, description: $description)
  }`

function TransactionRow({transaction}:{
  transaction?: Transaction
}) {
  const originalEmail = transaction?.email || ''
  const originalCount = transaction?.count || 0
  const originalAmount = transaction?.amountCents || 0
  const originalDescription = transaction?.description || ''
  const timestamp = transaction?.timestamp || new Date().toISOString()

  const [newEmail, setEmail] = useState(originalEmail)
  const [newCount, setCount] = useState(originalCount)
  const [newAmount, setAmount] = useState(originalAmount)
  const [newDescription, setDescription] = useState(originalDescription)
  const [editing, setEditing] = useState(false)
  const modified = (newEmail !== originalEmail) || (newCount !== originalCount) || (newAmount !== originalAmount) || (newDescription !== originalDescription)
  const [submitTransaction, transactionMutation] = useMutation(SAVE_TRANSACTION, {
    refetchQueries: ["GetTransactions"]})

  return <tr>
    <td>{transaction?(new Date(timestamp)).toLocaleDateString('it'):''}</td>
    <td>{transaction?(new Date(timestamp)).toLocaleTimeString('it'):''}</td>
    <td>{transaction && !editing ? originalEmail
      :<input type="email" placeholder="email" value={newEmail} onChange={e => setEmail(e.target.value)} />}
    </td>
    <td>{transaction && !editing ? originalCount
      :<input type="number" placeholder="count" value={newCount || ''} onChange={e => setCount(parseInt(e.target.value) || 0)} />}
    </td>
    <td>{transaction && !editing ?(`${(originalAmount/100).toFixed(2)}€`)
      :<input type="number" placeholder="cents" value={newAmount || ''} onChange={e => setAmount(parseInt(e.target.value))} />}
    </td>
    <td>{transaction && !editing ?originalDescription
    :<input type="text" placeholder="description" value={newDescription} onChange={e => setDescription(e.target.value)} />}
    </td>
    <td>{modified && 
      <button className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        disabled={transactionMutation.loading}
        onClick={save}>
        salva
      </button>}      
      {modified || editing && 
      <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={cancel}>
        annulla
      </button>}
      {transaction && !editing && 
      <button className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
        onClick={e => setEditing(true)}>
        modifica
      </button>}
    </td>
  </tr>

  function cancel() {
    setEmail(originalEmail)
    setCount(0)
    setAmount(originalAmount)
    setDescription(originalDescription)
    setEditing(false)
  }

  async function save() {
    const variables = {
      _id: transaction?._id,
      email: newEmail,
      count: newCount,
      amountCents: newAmount,
      description: newDescription
    }
    console.log(`SAVE ${JSON.stringify(variables)}`)
    await submitTransaction({ variables })
    setEditing(false)
    if (!transaction) cancel()
  }
}

const GET_USERS = gql`
query GetUsers {
  users {
    email
    creditCents
    timestamp
  }
}`

function Users() {
    const {loading, error, data} = useQuery(GET_USERS)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <>
      <h2>bilancio utenti</h2>
      <table>
        <tbody>
            {data.users.map((user: any, i: number) => 
                <tr key={i}>
                    <td>{user.email}</td>
                    <td>{(user.creditCents/100).toFixed(2)}€</td>
                    <td>{(new Date(user.timestamp)).toLocaleDateString('it')}</td>
                </tr>
            )}
        </tbody>
      </table>
    </>
}