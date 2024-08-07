"use client"
import { useQuery, gql, useMutation } from '@apollo/client'
import { useState } from 'react'
import moment from 'moment-timezone'

import { SAVE_TRANSACTION } from '../page'
import Provider from '../../components/provider'
import Balance from '../../components/balance'
import Loading from '../../components/loading'
import Error from '../../components/error'
import Button from '../../components/Button'

export default function ImportPage({}) {
    return <Provider>
        <h1>dm-coffee import data</h1>
        Torna alla <a href='/admin'>pagina di amministrazione</a>
        <ImportWidget />
    </Provider>
}

type RowType = [string,string,string,string]

function ImportWidget() {
    const [submitTransaction, transactionMutation] = useMutation(SAVE_TRANSACTION, {
        refetchQueries: ["GetTransactions"]})
    const headers = ["data", "ora", "conteggio", "email"]
    const [table, setTable] = useState<RowType[]>([])
    return <>
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
        </Button>
        <Button
            onClick={() => submitData()}
        >
            Carica dati dalla tabella
        </Button>
        <table>
            <thead>
                <tr>{headers.map((header,i) => 
                    <th key={header}>{header} {i>0 && <Button onClick={() => move_left(i)}>&lt;=</Button>}</th>)}
                    <th>check</th>
                </tr>
            </thead>
            <tbody>
                {table.map((row, i) => 
                    <tr key={i}>
                        {row.map((cell, j) => 
                            <td key={j}>{cell}</td>
                        )}
                        <td>
                            { parseRow(row).error || 'ok' }
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    </>

    function importData(incoming_data: string) {
        setTable(incoming_data.split('\n').map(row => {
            const cols = row.split('\t')
            while (cols.length < headers.length) cols.push('')
            return cols.slice(0, headers.length) as RowType
        }))
    }

    function move_left(col: number) {
        setTable(table.map((row:RowType) => {
            const new_row:RowType = [...row]
            new_row[col-1] = row[col]
            new_row[col] = row[col-1]
            return new_row
        }))
    }

    function parseRow(row: RowType) {
        const [date, time, count_string, email] = row
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

    async function submitData() {
        setTable([])
        for (const row of table) {
            const variables = parseRow(row)
            if (variables.error) {
                setTable(table => [...table, row])
                continue
            } 
            try {
                console.log(`submitting ${JSON.stringify(variables)}`)
                const res = await submitTransaction({ variables })
                setTable(table => [...table, [JSON.stringify(res),row[1],row[2],row[3]]])
            } catch (err) {
                setTable(table => [...table, [`${err}`,row[1],row[2],row[3]]])
            }
        }
    }
}
