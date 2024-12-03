import { gql, useQuery } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'
import Amount from './Amount'
import { myDate, myTime } from '../utils'
import Table from './Table'
import Thead from './Thead'
import Td from './Td'
import Tr from './Tr'

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
  
    return <><Table>
        <Thead>
          <tr>
            <th scope="col" className="text-left px-6 py-3">quando</th>
            <th scope="col" className="text-right px-6 py-3">#</th>
            <th scope="col" className="text-right px-6 py-3">€</th>
            <th scope="col" className="text-left px-6 py-3">descrizione</th>
            <th scope="col" className="text-left px-6 py-3">tessera</th>
          </tr>
        </Thead>
        <tbody>{data.myTransactions.map((transaction: any, i: number) => 
            <Tr className="" key={i}>
              <Td>{myDate(transaction.timestamp)} {myTime(transaction.timestamp)}</Td>
              <Td className="text-right">{transaction.count || ""}</Td>
              <Td className="text-right"><Amount cents={transaction.amountCents}/></Td> 
              <Td>{transaction.description}</Td>
              <Td>{transaction.code||''}</Td>
            </Tr>
          )}
        </tbody>
      </Table>
      </>
  }

