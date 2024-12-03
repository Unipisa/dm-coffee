"use client"
import { useQuery, gql, useMutation } from '@apollo/client'
import { useState } from 'react'

import Provider from '../../components/Provider'
import Loading from '../../components/Loading'
import Error from '../../components/Error'
import SetCost from '../../components/SetCost'
import {myDate, myTime} from '../../utils'

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
      <table>
        <thead>
            <tr>
                <th colSpan={2}>data</th>
                <th>€</th>
            </tr>
        </thead>
        <tbody>
            {dataHistory.costHistory.map(({timestamp,cents}: {
                  timestamp: string, 
                  cents: number}) => 
                <tr key={timestamp}>
                    <td>{myDate(timestamp)}</td>
                    <td>{myTime(timestamp)}</td>
                    <td align="right">{(cents/100).toFixed(2)}€</td>
                </tr>
            )}
        </tbody>
      </table>
    </>
}