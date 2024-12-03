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
      <p>Credito: <Amount prefix="€" cents={data.credit.cents}/> (<b>{data.credit.count}</b> caffè)</p>
    </div>
  }
  
  