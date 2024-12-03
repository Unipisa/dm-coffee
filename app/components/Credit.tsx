import { useQuery, gql } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'

const GET_CREDIT = gql`
  query GetCredit {
    credit {
      cents,
      count
    }
  }`

export default function Credit() {
    const {loading, error, data} = useQuery(GET_CREDIT, {pollInterval:5000})
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <div>
      <p>Il tuo credito: € {(data.credit.cents / 100).toFixed(2)}, caffé: {data.credit.count}</p>
    </div>
  }
  
  