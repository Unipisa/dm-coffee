"use client"
import { useQuery, gql, useMutation } from '@apollo/client'
import { useState } from 'react'
import { PencilIcon, ArchiveBoxArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline'

import Provider from '../components/Provider'
import Balance from '../components/Balance'
import Loading from '../components/Loading'
import Error from '../components/Error'
import Amount from '../components/Amount'
import { myDate, myTime } from '../utils'

export default function Admin({}) {
    return <Provider>
        <Balance />
        <Transactions />
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
    const [edit,setEdit] = useState(false)
    const {loading, error, data} = useQuery(GET_TRANSACTIONS)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <>
      <div className="flex">
      {edit
        ? <a className="ml-auto" href="#" onClick={() => setEdit(false)}>
          termina modifiche
          </a>
        :<a className="ml-auto" href="#" onClick={() => setEdit(true)}>
          modifica
          </a>}
        </div>
      <table>
      <thead>
        <tr>
          <th colSpan={2}>
            data
          </th>
          <th>
            email
          </th>
          <th>
            #
          </th>
          <th>
            €
          </th>
          <th>
            description
          </th>
        </tr>
      </thead>
      <tbody>
        {edit && <TransactionRow edit={edit}/>}
        {data.transactions.map((transaction: Transaction) => 
          <TransactionRow key={transaction._id} transaction={transaction} edit={edit}/>
        )}
      </tbody>
    </table>
    </>
}

const SAVE_TRANSACTION = gql`
  mutation SaveTransaction($_id: String, $timestamp: String, $email: String, $count: Int, $amountCents: Int, $description: String) {
    transaction(_id: $_id, timestamp: $timestamp, email: $email, count: $count, amountCents: $amountCents, description: $description)
  }`

function TransactionRow({transaction, edit}:{
  transaction?: Transaction,
  edit?: boolean
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
  const date = transaction ? timestamp : new Date().toISOString()

  return <tr>
    <td>{myDate(date)}</td>
    <td>{myTime(date)}</td>
    <td>{transaction && !editing 
      ? originalEmail
      : <input type="email" placeholder="email" value={newEmail} onChange={e => setEmail(e.target.value)} />}
    </td>
    <td align="right">{transaction && !editing 
      ? (originalCount || '')
      : <input type="number" placeholder="count" value={newCount || ''} size={4} onChange={e => setCount(parseInt(e.target.value) || 0)} />}
    </td>
    <td align="right">{transaction && !editing 
      ? <Amount cents={originalAmount}/>
      : <input type="number" placeholder="cents" value={newAmount || ''} onChange={e => setAmount(parseInt(e.target.value))} />}
    </td>
    <td>{transaction && !editing ?originalDescription
    :<input type="text" placeholder="description" value={newDescription} onChange={e => setDescription(e.target.value)} />}
    </td>
    {edit && 
      <td>{modified && 
        <button className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
          disabled={transactionMutation.loading}
          onClick={save}>
          <ArchiveBoxArrowDownIcon className="h-5 w-5"/>
        </button>}      
        {modified || editing && 
        <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={cancel}>
          <XMarkIcon className="h-5 w-5"/>
        </button>}
        {transaction && !editing && 
        <button className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800"
          onClick={e => setEditing(true)}>
          <PencilIcon className="h-5 w-5"/>
        </button>}
      </td>
    }
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
