import { gql, useQuery } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'
import Amount from './Amount'
import { myDate, myTime } from '../utils'

const GET_MY_TRANSACTIONS = gql`
  query GetMyTransactions {
    myTransactions {
      timestamp
      count
      amountCents
      description
      code
    }
  }`

export default function Transactions() {
    const {loading, error, data} = useQuery(GET_MY_TRANSACTIONS, {pollInterval: 5000})
  
    if (loading) return <Loading />
    if (error) return <Error error={error} />
  
    return <><table className="border-0 lg:rounded-lg mt-2 table-auto overflow-x-auto shadow-md text-align-left">
        <thead className='border-t-2 border-gray-300 text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 text-align-left'>
          <tr>
            <th scope="col" className="text-left px-6 py-3">quando</th>
            <th scope="col" className="text-right px-6 py-3">#</th>
            <th scope="col" className="text-right px-6 py-3">€</th>
            <th scope="col" className="text-left px-6 py-3">descrizione</th>
            <th scope="col" className="text-left px-6 py-3">tessera</th>
          </tr>
        </thead>
        <tbody>{data.myTransactions.map((transaction: any, i: number) => 
            <tr className="border-0 odd:bg-white odd:dark:bg-gray-900 even:bg-gray-100 even:dark:bg-gray-800 border-b dark:border-gray-700" key={i}>
              <td className="border-0 text-sm px-6 py-4">{myDate(transaction.timestamp)} {myTime(transaction.timestamp)}</td>
              <td className="border-0 text-sm px-6 py-4" align="right">{transaction.count || ""}</td>
              <td className="border-0 text-sm px-6 py-4" align="right"><Amount cents={transaction.amountCents}/></td> 
              <td className="border-0 text-sm px-6 py-4">{transaction.description}</td>
              <td className="border-0 text-sm px-6 py-4">{transaction.code||''}</td>
            </tr>
          )}
        </tbody>
      </table>
      </>
  }

