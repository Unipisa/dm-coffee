import { gql, useQuery } from '@apollo/client'

import Loading from './loading'
import Error from './error'

const GET_TRANSACTIONS = gql`
  query GetTransactions {
    transactions {
      timestamp
      amountCents
      description
    }
  }`

export default function Transactions() {
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
  
