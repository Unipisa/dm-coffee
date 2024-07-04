import { useQuery, gql } from '@apollo/client'

import Loading from './loading'
import Error from './error'

const GET_BALANCE = gql`
  query GetBalance {
    balance
  }`

export default function Balance() {
    const {loading, error, data} = useQuery(GET_BALANCE, {
      pollInterval: 5000
    })
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <div>
      <p>Bilancio complessivo: € {(data.balance / 100).toFixed(2)}</p>
    </div>
  }
  
