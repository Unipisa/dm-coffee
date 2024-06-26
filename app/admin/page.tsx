"use client"
import { useQuery, gql } from '@apollo/client'

import Provider from '../components/provider'
import Balance from '../components/balance'
import Loading from '../components/loading'
import Error from '../components/error'

export default function Admin({}) {
    return <Provider>
        <h1>dm-coffee admin</h1>
        Torna alla <a href='/'>pagina principale</a>
        <Balance />       
        <Transactions />
    </Provider>
}

const GET_TRANSACTIONS = gql`
  query GetTransactions {
    transactions {
      timestamp
      email
      amountCents
      description
    }
  }`

function Transactions() {
    const {loading, error, data} = useQuery(GET_TRANSACTIONS)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <table>
        <tbody>
            {data.transactions.map((transaction: any, i: number) => 
                <tr key={i}>
                    <td>{(new Date(transaction.timestamp)).toLocaleDateString('it')}</td>
                    <td>{transaction.email}</td>
                    <td>{(transaction.amountCents/100).toFixed(2)}</td>
                    <td>{transaction.description}</td>
                </tr>
            )}
        </tbody>
    </table>
}

const GET_USERS = gql`
query GetUsers {
  users {
    email
    creditCents
  }
}`

function Users() {
    
}