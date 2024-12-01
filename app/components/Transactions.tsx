import { gql, useQuery } from '@apollo/client'
import {Temporal} from '@js-temporal/polyfill'

import Loading from './loading'
import Error from './Error'

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
  
    return <table className="table-auto">
        <thead>
          <tr>
            <th colSpan={2}>quando</th>
            <th>caffé</th>
            <th>€</th>
            <th>descrizione</th>
            <th>tessera</th>
          </tr>
        </thead>
        <tbody>{data.myTransactions.map((transaction: any, i: number) => 
            <tr key={i}>
              <td className="text-sm">{myDate(transaction.timestamp)}</td>
              <td className="text-sm">{myTime(transaction.timestamp)}</td>
              <td align="right">{transaction.count || ""}</td>
              <td align="right"><b>{(transaction.amountCents/100).toFixed(2)}</b></td> 
              <td><i>{transaction.description}</i></td>
              <td className="text-sm">{transaction.code||''}</td>
            </tr>
          )}
        </tbody>
      </table>
  }

function myDateTime(isoTimestamp: string|undefined|null) {
  if (isoTimestamp === undefined) return '???'
  if (isoTimestamp === null) return '---'

  const instant = Temporal.Instant.from(isoTimestamp)
  const zonedDateTime = instant.toZonedDateTimeISO('Europe/Rome')
  const {day, month, year, hour, minute} = zonedDateTime
  return `${day}.${month}.${year} ${hour}:${String(minute).padStart(2, '0')}`
}  

function myDate(isoTimestamp: string|undefined|null) {
  if (isoTimestamp === undefined) return '???'
  if (isoTimestamp === null) return '---'

  const instant = Temporal.Instant.from(isoTimestamp)
  const zonedDateTime = instant.toZonedDateTimeISO('Europe/Rome')
  const {day, month, year} = zonedDateTime
  return `${day}.${month}.${year}`
}  

function myTime(isoTimestamp: string|undefined|null) {
  if (isoTimestamp === undefined) return '???'
  if (isoTimestamp === null) return '---'

  const instant = Temporal.Instant.from(isoTimestamp)
  const zonedDateTime = instant.toZonedDateTimeISO('Europe/Rome')
  const {hour, minute} = zonedDateTime
  return `${hour}:${String(minute).padStart(2, '0')}`
}