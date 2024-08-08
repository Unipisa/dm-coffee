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

type COLS = [string,string,string,string]

type RowType = {
    state: string
    cols: COLS
}

function parseRow(cols: COLS) {
    const [date, time, count_string, email] = cols
    const [day,month,year] = date.split('/').map(x => parseInt(x))
    if (year<2000 || year > 3000 || day<1 || day>31 || month<1 || month>12) {
        return {error: `invalid date ${date}`}
    }
    const [hours,minutes,seconds] = time.split(':').map(x => parseInt(x))
    const iso_timestamp = `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    const timestamp = moment.tz(iso_timestamp, 'Europe/Rome').toISOString()
    if (!timestamp) return {error: `invalid timestamp`, iso_timestamp}
    const count = parseInt(count_string)
    if (!count) return {error: `invalid count ${count_string}`}
    const amountCents = count * 20
    return {
        timestamp,
        count,
        amountCents,
        email,
        description: `imported on ${new Date().toISOString()}`,
    }

    function pad(n:number) {
        return ('00'+n).slice(-2)
    }
}

function validate(cols: COLS) {
    const error = parseRow(cols).error
    if (!error) return 'valid'
    return error
}

function ImportWidget() {
    const [submitTransaction, transactionMutation] = useMutation(SAVE_TRANSACTION, {
        refetchQueries: ["GetTransactions"]})
    const headers = ["data", "ora", "conteggio", "email"]
    const [table, setTable] = useState<RowType[]>([])
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
                    {headers.map((header,i) => 
                    <th key={header}>{header} {i>0 && <Button onClick={() => move_left(i)}>&lt;=</Button>}</th>)}
                </tr>
            </thead>
            <tbody>
                {table.map((row, i) => 
                    <tr key={i}>
                        <td>{row.state}</td>
                        {row.cols.map((cell, j) => 
                            <td key={j}>{cell}</td>
                        )}
                    </tr>
                )}
            </tbody>
        </table>
    </>

    function importData(incoming_data: string) {
        setTable(incoming_data.split('\n').map(row => {
            const incoming_cols = row.split('\t')
            while (incoming_cols.length < 4) incoming_cols.push('')
            const cols = incoming_cols.slice(0, 4) as COLS
            
            return {
                state: validate(cols),
                cols
            }
        }))
    }

    function move_left(col: number) {
        setTable(table.map((row:RowType) => {
            const new_cols:COLS = [...row.cols]
            new_cols[col-1] = row.cols[col]
            new_cols[col] = row.cols[col-1]
            return {
                state: 'new',
                cols: new_cols
            }
        }))
    }

    async function submitData() {
        setTable([])
        for (const row of table) {
            if (row.state != 'valid') {
                setTable(table => [...table, row])
                continue
            }
            const variables = parseRow(row.cols)
            if (variables.error) {
                setTable(table => [...table, {
                    state: variables.error,
                    cols: row.cols
                }])
                continue
            } 
            try {
                console.log(`submitting ${JSON.stringify(variables)}`)
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
