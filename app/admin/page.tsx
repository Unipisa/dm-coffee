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
import Table from '../components/Table'
import Thead from '../components/Thead'
import Tr from '../components/Tr'
import Td from '../components/Td'
import Th from '../components/Th'

export default function Admin({}) {
    return <Provider>
        <Balance/>
        <TransactionYears />
    </Provider>
}

const GET_TRANSACTION_YEARS = gql`
  query GetTransactionYears {
    transactionYears
  }`

function TransactionYears() {
  const {loading, error, data} = useQuery(GET_TRANSACTION_YEARS)
  const [year, setYear] = useState(new Date().getFullYear())
  if (loading) return <Loading />
  if (error) return <Error error={error}/>
  return <> 
    <select onChange={evt => setYear(parseInt(evt.target.value))}>
    {data.transactionYears.map((y: number) => 
      <option key={y} value={y} selected={y===year}>{y}</option>
    )}
    </select>
    <Transactions year={year}/>
  </>
}

const GET_TRANSACTIONS = gql`
  query GetTransactions($year: Int) {
    transactions(year: $year) {
      _id 
      timestamp
      email
      count
      amountCents
      coffeeGrams
      description
      code
      cumulativeCount
      cumulativeAmountCents
      cumulativeCoffeeGrams
      cumulativeNegativeCount
      cumulativePositiveCount
      cumulativeNegativeAmountCents
      cumulativePositiveAmountCents
      cumulativeNegativeCoffeeGrams
      cumulativePositiveCoffeeGrams
    }
  }`

type Transaction = {
  _id: string,
  timestamp: string,
  email: string,
  count: number,
  amountCents: number,
  coffeeGrams: number,
  description: string,
  code: string,
  cumulativeCount: number,
  cumulativeAmountCents: number,
  cumulativeCoffeeGrams: number,
  cumulativeNegativeCount: number,
  cumulativePositiveCount: number,
  cumulativeNegativeAmountCents: number,
  cumulativePositiveAmountCents: number,
  cumulativeNegativeCoffeeGrams: number,
  cumulativePositiveCoffeeGrams: number,
}

function Transactions({year}:{year: number}) {
    const [edit,setEdit] = useState(false)
    const {loading, error, data} = useQuery(GET_TRANSACTIONS, {
      variables: {year}
    })
    const [showSums, setShowSums] = useState<number>(0)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <>
      <div className="flex">
        <span className="ml-auto"></span>
        <select className="ml-2" value={showSums} onChange={evt => setShowSums(parseInt(evt.target.value))}>
          <option value={0}>no sums</option>
          <option value={1}>sums</option>
          <option value={2}>positive-negative sums</option>
        </select>
      {edit
        ? <a className="ml-2" href="#" onClick={() => setEdit(false)}>
          termina modifiche
          </a>
        :<a className="ml-2" href="#" onClick={() => setEdit(true)}>
          modifica
          </a>}
        </div>
      <Table>
      <Thead>
        <tr>
          <Th className="text-left">
            data
          </Th>
          <Th className="text-left">
            email
          </Th>
          <Th className="text-right">
            #
          </Th>
          {showSums>0 && 
          <Th className="text-right">
            tot #
          </Th>}
          <Th className="text-right">
            €
          </Th>
          {showSums>0 && 
          <Th className="text-right">
            tot €
          </Th>}
          <Th className="text-left">
            g
          </Th>
          {showSums>0 && 
          <Th className="text-right">
            tot g
          </Th>}
          <Th className="text-left">
            description
          </Th>
          {!edit && <Th className="tex-left">
              card
          </Th>}
        </tr>
      </Thead>
      <tbody>
        {edit && <TransactionRow edit={edit} showSums={0}/>}
        {data.transactions.map((transaction: Transaction) => 
          <TransactionRow key={transaction._id} transaction={transaction} edit={edit} showSums={showSums}/>
        )}
      </tbody>
    </Table>
    </>
}

const SAVE_TRANSACTION = gql`
  mutation SaveTransaction($_id: String, $timestamp: String, $email: String, $count: Int, $amountCents: Int, $coffeeGrams: Int, $description: String) {
    transaction(_id: $_id, timestamp: $timestamp, email: $email, count: $count, amountCents: $amountCents, coffeeGrams: $coffeeGrams, description: $description)
  }`

function TransactionRow({transaction, edit, showSums=0}:{
  transaction?: Transaction,
  edit?: boolean,
  showSums: number,
}) {
  const originalEmail = transaction?.email || ''
  const originalCount = transaction?.count || 0
  const originalAmount = transaction?.amountCents || 0
  const originalGrams = transaction?.coffeeGrams || 0
  const originalDescription = transaction?.description || ''
  const timestamp = transaction?.timestamp || new Date().toISOString()

  const [newEmail, setEmail] = useState(originalEmail)
  const [newCount, setCount] = useState(originalCount)
  const [newAmount, setAmount] = useState(originalAmount)
  const [newGrams, setGrams] = useState(originalGrams)
  const [newDescription, setDescription] = useState(originalDescription)
  const [editing, setEditing] = useState(false)
  const modified = (newEmail !== originalEmail) || (newCount !== originalCount) || (newAmount !== originalAmount) || (newDescription !== originalDescription)
  const [submitTransaction, transactionMutation] = useMutation(SAVE_TRANSACTION, {
    refetchQueries: ["GetTransactions"]})
  const date = transaction ? timestamp : new Date().toISOString()

  return <Tr>
    <Td>{myDate(date)} {myTime(date)}</Td>
    <Td>{transaction && !editing 
      ? originalEmail
      : <input type="email" placeholder="email" value={newEmail} onChange={e => setEmail(e.target.value)} />}
    </Td>
    <Td className="text-right">{transaction && !editing 
      ? (originalCount || '')
      : <input 
          type="number" placeholder="count" value={newCount || ''} 
          size={4} style={{width: "4em"}} onChange={e => setCount(parseInt(e.target.value) || 0)} />}
    </Td>
    { showSums>0 &&
    <Td className="text-right">{transaction &&
      (showSums===1 ? transaction.cumulativeCount: `${transaction.cumulativePositiveCount} ${transaction.cumulativeNegativeCount}`)}
    </Td>}
    <Td className="text-right">{transaction && !editing 
      ? <Amount cents={originalAmount}/>
      : <input 
          type="number" placeholder="cents" value={newAmount || ''} 
          size={5} style={{width: "6em"}} onChange={e => setAmount(parseInt(e.target.value))} />}
    </Td>
    { showSums>0 && 
    <Td className="text-right">{transaction && 
      (showSums ===1 
      ? <Amount cents={transaction?.cumulativeAmountCents || 0}/>
      : <><Amount cents={transaction.cumulativePositiveAmountCents}/> <Amount cents={transaction.cumulativeNegativeAmountCents}/></>
      )}
    </Td>}
    <Td className="text-right">{transaction && !editing
      ? (originalGrams || '')
      : <input 
          type="number" placeholder="grams" value={newGrams || ''} 
          size={5} style={{width: "6em"}} onChange={e => setGrams(parseInt(e.target.value) || 0)} />}
    </Td>
    { showSums>0 && 
      <Td className="text-right">
        {transaction && (showSums === 1 
          ? transaction.cumulativeCoffeeGrams
          : `${transaction.cumulativePositiveCoffeeGrams} ${transaction.cumulativeNegativeCoffeeGrams}`
        )}
      </Td>
         
      }
    <Td>{transaction && !editing ?originalDescription
    :<input type="text" placeholder="description" value={newDescription} onChange={e => setDescription(e.target.value)} />}
    </Td>
    {!edit && <Td>{transaction?.code}</Td> }
    {edit && 
      <Td>{modified && 
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
      </Td>
    }
  </Tr>

  function cancel() {
    setEmail(originalEmail)
    setCount(0)
    setAmount(originalAmount)
    setGrams(originalGrams)
    setDescription(originalDescription)
    setEditing(false)
  }

  async function save() {
    const variables = {
      _id: transaction?._id,
      email: newEmail,
      count: newCount,
      amountCents: newAmount,
      coffeeGrams: newGrams,
      description: newDescription
    }
    console.log(`SAVE ${JSON.stringify(variables)}`)
    await submitTransaction({ variables })
    setEditing(false)
    if (!transaction) cancel()
  }
}
