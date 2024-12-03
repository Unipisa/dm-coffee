import { useQuery, gql } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'

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
      <p>Bilancio complessivo: € {(data.balance.cents / 100).toFixed(2)} per {data.balance.count} caffé</p>
    </div>
  }
  
