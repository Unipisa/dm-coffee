"use client"
import { useQuery, gql } from '@apollo/client'

import Provider from '../../components/Provider'
import Loading from '../../components/Loading'
import Error from '../../components/Error'
import SetCost from '../../components/SetCost'
import {myDate, myTime} from '../../utils'
import Table from '../../components/Table'
import Thead from '../../components/Thead'
import Td from '../../components/Td'
import Th from '../../components/Th'
import Tr from '../../components/Tr'

export default function CostPage({}) {
    return <Provider>
        <CostHistory />
    </Provider>
}

const GET_COST = gql`
query GetCost {
  cost
}`

const GET_COST_HISTORY = gql`
query GetCostHistory {
  costHistory {
    timestamp
    cents
  }
}`

function CostHistory() {
    const {loading: loadingCost, error: errorCost, data: dataCost} = useQuery(GET_COST)
    const {loading: loadingHistory, error: errorHistory, data: dataHistory} = useQuery(GET_COST_HISTORY)
    if (loadingHistory || loadingCost) return <Loading />
    if (errorCost) return <Error error={errorCost}/>
    if (errorHistory) return <Error error={errorHistory}/>
    return <>
        <p>Costo attuale: <b>{(dataCost.cost/100).toFixed(2)}€</b></p>
        <SetCost value={dataCost.cost}/>
      <Table>
        <Thead>
            <tr>
                <Th className="text-left">data</Th>
                <Th className="text-right">€</Th>
            </tr>
        </Thead>
        <tbody>
            {dataHistory.costHistory.map(({timestamp,cents}: {
                  timestamp: string, 
                  cents: number}) => 
                <Tr key={timestamp}>
                    <Td>{myDate(timestamp)} {myTime(timestamp)}</Td>
                    <Td className="text-right">{(cents/100).toFixed(2)}€</Td>
                </Tr>
            )}
        </tbody>
      </Table>
    </>
}