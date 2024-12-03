import { gql, useQuery } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'
import Amount from './Amount'
import { myDate, myTime } from '../utils'
import Table from './Table'
import Thead from './Thead'
import Td from './Td'
import Tr from './Tr'
import Th from './Th'

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
            <Th className="text-left" >quando</Th>
            <Th className="text-right">#</Th>
            <Th className="text-right">€</Th>
            <Th className="text-left">descrizione</Th>
            <Th className="text-left hidden md:block">tessera</Th>
          </tr>
        </Thead>
        <tbody>{data.myTransactions.map((transaction: any, i: number) => 
            <Tr className="" key={i}>
              <Td>{myDate(transaction.timestamp)} {myTime(transaction.timestamp)}</Td>
              <Td className="text-right">{transaction.count || ""}</Td>
              <Td className="text-right"><Amount cents={transaction.amountCents}/></Td> 
              <Td>{transaction.description}</Td>
              <Td className="hidden md:block">{transaction.code||''}</Td>
            </Tr>
          )}
        </tbody>
      </Table>
      </>
  }

