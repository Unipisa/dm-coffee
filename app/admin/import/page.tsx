"use client"
import { gql, useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import moment from 'moment-timezone'

import Provider from '../../components/Provider'
import Button from '../../components/Button'
import Loading from '../../components/Loading'
import Error from '../../components/Error'
import { myDate } from '../../utils'
import Table from '../../components/Table'
import Thead from '../../components/Thead'
import Th from '../../components/Th'
import Tr from '../../components/Tr'
import Td from '../../components/Td'

const SAVE_TRANSACTION = gql`
  mutation SaveTransaction($_id: String, $timestamp: String, $email: String, $count: Int, $amountCents: Int, $coffeeGrams: Int, $description: String) {
    transaction(_id: $_id, timestamp: $timestamp, email: $email, count: $count, amountCents: $amountCents, coffeeGrams: $coffeeGrams, description: $description)
  }`

const GET_COST = gql`
    query GetCost {
        cost
    }`


export default function ImportPage({}) {
    return <Provider>
        <ImportWidget />
    </Provider>
}

type COLS = string[]

type RowType = {
    state: string
    cols: COLS
}

const headers = ['date', 'time', 'count', 'amount', 'grams', 'email', 'description']
type Headers = typeof headers[number]
type Mapping = Record<Headers, number | undefined>
type Variables = {
    timestamp?: string
    count?: number
    amountCents?: number
    coffeeGrams?: number
    email?: string
    description?: string
}

function parseRow(mapping: Mapping, cols: COLS, COST: number) {
    let error = ''
    const mapped = Object.fromEntries(headers.map(h => {
        let val = mapping[h]
        if (val === undefined) return [h, '']        
        return [h,cols[val]]
    }))
    const variables: Variables = {}

    if (mapped.date) {
        const [day,month,year] = mapped.date.split('/').map(x => parseInt(x))
        if (year<2000 || year > 3000 || day<1 || day>31 || month<1 || month>12) error ||= `invalid date ${mapped.date}`
        const [hours,minutes,seconds] = mapped.time ? mapped.time.split(':').map(x => parseInt(x)) : [12,0,0]
        const iso_timestamp = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
        const timestamp = moment.tz(iso_timestamp, 'Europe/Rome').toISOString()
        if (!timestamp) error ||= `invalid timestamp ${iso_timestamp}`
        variables.timestamp = timestamp
    } else {
        error ||= `date is required`
    }

    if (mapped.count) {
        const count = parseInt(mapped.count)
        if (`${count}` !== mapped.count) error ||= `invalid count ${mapped.count}`
        variables.count = count
        if (!mapped.amount) variables.amountCents = -count * COST
    }

    if (mapped.amount) {
        const amountCents = Math.round(parseFloat(mapped.amount)*100)
        if (`${amountCents/100}` !== mapped.amount) error ||= `invalid amount ${mapped.amount}`
        variables.amountCents = amountCents
        if (!mapped.count) variables.count = 0
    }

    if (mapped.grams) {
        const grams = parseInt(mapped.grams)
        if (`${grams}` !== mapped.grams) error ||= `invalid grams ${mapped.grams}`
        variables.coffeeGrams = grams
    }

    if (!mapped.count && !mapped.amount && !mapped.grams) error ||= `either count, grams or amount required`

    variables.email = mapped.email
    if (!mapped.email || !mapped.email.includes('@')) error ||= `invalid email ${mapped.email}`

    variables.description = mapped.description || `importato il ${myDate(new Date().toISOString())}`

    return {
        ...variables,
        error,
    }

    function pad(n:number) {
        return ('00'+n).slice(-2)
    }    
}

function ImportWidget() {
    const {loading: loadingCost, error: errorCost, data: dataCost} = useQuery(GET_COST)
    const COST = dataCost?.cost
    const [submitTransaction, transactionMutation] = useMutation(SAVE_TRANSACTION, {
        refetchQueries: ["GetTransactions"]})
    const [table, setTable] = useState<RowType[]>([])
    const [mapping, setMapping] = useState<Mapping>({})

    const ncols = table.reduce((max, el) => Math.max(el.cols.length,max), 0)

    if (loadingCost) return <Loading />
    if (errorCost) return <Error error={errorCost}/>

    return <>
        { table.length === 0 && <p>
            Copia le righe dal tuo foglio di calcolo
            e premi il pulsante.
        </p>}
        <br />
        <Button
            onClick={async () => {
                try {
                    const clipboardText = await navigator.clipboard.readText();
                    importData(clipboardText);
                } catch (err) {
                    console.error('Failed to read clipboard contents: ', err);
                }
            }}
        >
            Incolla dalla clipboard
        </Button> {}
        { table.length>0 && <Button onClick={submitData}>
            Carica dati &quot;valid&quot; dalla tabella
        </Button>}
        <div className="my-2"/>
        <Table>
            <Thead>
                <tr>
                    <Th>state</Th>
                    <Th>timestamp</Th>
                    <Th>count</Th>
                    <Th>amountCents</Th>
                    <Th>coffeeGrams</Th>
                    <Th>email</Th>
                    <Th>description</Th>
                    {Array.from({length: ncols}, (_,i) => i).map(i => 
                        <Th key={i}>
                            <select value={
                                (Object.entries(mapping)
                                    .filter(([h,n]) => n===i)[0]||[''])[0]
                            } onChange={
                                evt => {
                                    const val = evt.target.value
                                    setMapping(mapping => ({...mapping, [val]: i}))
                                }
                            }>  
                                <option value=''>-- map --</option>
                                {headers.map(h => 
                                    <option key={h} value={h}>{h}</option>
                                )}
                            </select>
                        </Th>)}
                </tr>
            </Thead>
            <tbody>
                {table.map((row, i)=> ({row, i, parse: parseRow(mapping, row.cols, COST)})).map(item => 
                    <Tr key={item.i}>
                        <Td className={"bg-gray-300 " + (item.row.state || item.parse.error ? (item.row.state==="imported" ? "text-blue-500" : "text-red-500") : "text-green-500")}>{item.row.state || item.parse.error || 'valid'}</Td>
                        <Td>{new Date(item.parse.timestamp||'').toLocaleString()}</Td>
                        <Td>{item.parse.count}</Td>
                        <Td>{item.parse.amountCents}</Td>
                        <Td>{item.parse.coffeeGrams}</Td>
                        <Td>{item.parse.email}</Td>
                        <Td>{item.parse.description}</Td>
                        {item.row.cols.map((cell, j) => 
                            <Td className="bg-gray-300" key={j}>{cell}</Td>
                        )}
                    </Tr>
                )}
            </tbody>
        </Table>
    </>

    function importData(incoming_data: string) {
        setTable(incoming_data.split('\n').map(row => {
            const cols = row.split('\t')
            
            return {
                state: '',
                cols
            }
        }))
    }

    async function submitData() {
        setTable([])
        for (const row of table) {
            if (row.state != '') {
                setTable(table => [...table, row])
                continue
            }
            const parse = parseRow(mapping, row.cols, COST)
            if (parse.error) {
                setTable(table => [...table, {
                    state: parse.error,
                    cols: row.cols
                }])
                continue
            } 
            try {
                const {error, ...variables} = parse
                console.log(`submitting ${JSON.stringify(parse)}`)
                const res = await submitTransaction({ variables })
/*              if (variables.amountCents && false) {
                    // partita doppia
                    const res2 = await submitTransaction({ 
                        variables: {
                            ...variables,
                            amountCents: -variables.amountCents,
                            email: 'filippo.callegaro@unipi.it',
                            description: `da ${variables.email}: ${variables.description}`
                        }
                    }) 
                    // se fallisce siamo del gatto...
                }*/
                setTable(table => [...table, 
                    { 
                        state: res.data ? 'imported' : 'api error',
                        cols: row.cols
                    }])
            } catch (err) {
                setTable(table => [...table, {
                    state: 'network error',
                    cols: row.cols
                }])
            }
        }
    }
}
