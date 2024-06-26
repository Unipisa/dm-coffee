import { gql, useQuery } from '@apollo/client'

import Loading from './loading'
import Error from './error'

const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions {
    myTransactions {
      timestamp
      amountCents
      description
      code
    }
  }`

export default function Transactions() {
    const {loading, error, data} = useQuery(GET_MY_TRANSACTIONS, {pollInterval: 5000})
  
    if (loading) return <Loading />
    if (error) return <Error error={error} />
  
    return <table className="table-auto">
        <tbody>{data.myTransactions.map((transaction: any, i: number) => 
            <tr key={i}>
              <td>{(new Date(transaction.timestamp)).toLocaleDateString('it')}</td>
              <td>{(transaction.amountCents/100).toFixed(2)}</td> 
              <td>{transaction.description}</td>
              <td>{transaction.code||''}</td>
            </tr>
          )}
        </tbody>
      </table>
  }
  
