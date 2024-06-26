import { useQuery, gql } from '@apollo/client'

import Loading from './loading'
import Error from './error'

const GET_CREDIT = gql`
  query GetCredit {
    credit
  }`

export default function Credit() {
    const {loading, error, data} = useQuery(GET_CREDIT)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <div>
      <p>Il tuo credito: € {(data.credit / 100).toFixed(2)}</p>
    </div>
  }
  
  