import { useQuery, gql } from '@apollo/client'

import Loading from './Loading'
import Error from './Error'
import Amount from './Amount'

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
      <p>Il tuo credito: <Amount prefix="€" cents={data.credit.cents}/>, caffé: <b>{data.credit.count}</b></p>
    </div>
  }
  
  