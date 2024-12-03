import { useQuery, gql } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'
import Amount from './Amount'

const GET_BALANCE = gql`
  query GetBalance {
    balance {
      cents
      count
    }
  }`

export default function Balance() {
    const {loading, error, data} = useQuery(GET_BALANCE, {
      pollInterval: 5000
    })
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <div>
      <p>Bilancio complessivo: <Amount prefix="€" cents={data.balance.cents}/> per <b>{data.balance.count}</b> caffé</p>
    </div>
  }
  
