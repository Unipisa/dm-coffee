"use client"
import { gql, useMutation } from '@apollo/client'
import { useState } from 'react'
import moment from 'moment-timezone'

import Provider from '../../components/provider'
import Button from '../../components/Button'

const SAVE_TRANSACTION = gql`
  mutation SaveTransaction($_id: String, $timestamp: String, $email: String, $count: Int, $amountCents: Int, $description: String) {
    transaction(_id: $_id, timestamp: $timestamp, email: $email, count: $count, amountCents: $amountCents, description: $description)
  }`

export default function ImportPage({}) {
    return <Provider>
        <h1>dm-coffee import data</h1>
        Torna alla <a href='/admin'>pagina di amministrazione</a>
        <br />
        <ImportWidget />
    </Provider>
}

type COLS = string[]

type RowType = {
    state: string
    cols: COLS
}

const headers = ['date', 'time', 'count', 'email', 'description']
type Headers = typeof headers[number]
type Mapping = Record<Headers, number | undefined>
type Variables = {
    timestamp?: string
    count?: number
    amountCents?: number
    email?: string
    description?: string
}

function parseRow(mapping: Mapping, cols: COLS) {
    let error = ''
    const mapped = Object.fromEntries(headers.map(h => [h,mapping[h]===undefined ? '' : cols[mapping[h]]]))
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
        if (!mapped.amount) variables.amountCents = -count * 20 
    }

    if (mapped.amount) {
        const amountCents = parseFloat(mapped.amount)*100
        if (`${amountCents/100}` !== mapped.amount) error ||= `invalid amount ${mapped.amount}`
        variables.amountCents = amountCents
        if (!mapped.count) variables.count = 0
    }

    if (!mapped.count && !mapped.amount) error ||= `either count or amount required`

    variables.email = mapped.email
    if (!mapped.email || !mapped.email.includes('@')) error ||= `invalid email ${mapped.email}`

    variables.description = mapped.description || `imported on ${new Date().toISOString()}`

    return {
        ...variables,
        error,
    }

    function pad(n:number) {
        return ('00'+n).slice(-2)
    }    
}

function ImportWidget() {
    const [submitTransaction, transactionMutation] = useMutation(SAVE_TRANSACTION, {
        refetchQueries: ["GetTransactions"]})
    const [table, setTable] = useState<RowType[]>([])
    const [mapping, setMapping] = useState<Mapping>({})

    const ncols = table.reduce((max, el) => Math.max(el.cols.length,max), 0)

    return <>
        Seleziona le righe dal tuo foglio di calcolo
        e premi il pulsante [Incolla dalla clipboard]
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
        <Button
            onClick={() => submitData()}
        >
            Carica dati &quot;valid&quot; dalla tabella
        </Button>
        <table>
            <thead>
                <tr>
                    <th>state</th>
                    <th>timestamp</th>
                    <th>count</th>
                    <th>amountCents</th>
                    <th>email</th>
                    <th>description</th>
                    {Array.from({length: ncols}, (_,i) => i).map(i => 
                        <th key={i}>
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
                                    <option value={h}>{h}</option>
                                )}
                            </select>
                        </th>)}
                </tr>
            </thead>
            <tbody>
                {table.map((row, i)=> ({row, i, parse: parseRow(mapping, row.cols)})).map(item => 
                    <tr key={item.i}>
                        <td>{item.row.state || item.parse.error || 'valid'}</td>
                        <td>{new Date(item.parse.timestamp||'').toLocaleString()}</td>
                        <td>{item.parse.count}</td>
                        <td>{item.parse.amountCents}</td>
                        <td>{item.parse.email}</td>
                        <td>{item.parse.description}</td>
                        {item.row.cols.map((cell, j) => 
                            <td key={j}>{cell}</td>
                        )}
                    </tr>
                )}
            </tbody>
        </table>
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
            const parse = parseRow(mapping, row.cols)
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
