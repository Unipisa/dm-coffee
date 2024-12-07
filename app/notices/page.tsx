"use client"
import {useState} from 'react'
import {useMutation, gql, useQuery, useApolloClient} from '@apollo/client'

import Provider, {useProfile} from '../components/Provider'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Error from '../components/Error'
import Table from '../components/Table'
import Td from '../components/Td'
import Tr from '../components/Tr'   
import Th from '../components/Th'
import {myDate} from '../utils'

export default function NoticesPage() {
    return <Provider>
        <Notices />
    </Provider>
}

const GET_NOTICES = gql`
query GetNotices {
    notices {
        _id
        timestamp
        message
        email
    }
}`

const SOLVE_NOTICE = gql`
mutation SolveNotice($_id: String!) {
    solveNotice(_id: $_id)
}`

function Notices({}) {
    const profile = useProfile()
    const {loading, error, data} = useQuery(GET_NOTICES)
    const client = useApolloClient()

    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <>
        <CreateNotice />
        { data.notices.length === 0 ? 
            <div className="text-center">
                nessuna segnalazione
            </div> :
        <Table>
            <Tr>
                <Th>quando</Th>
                <Th>cosa</Th>
                { profile?.admin && <>
                    <Th>chi</Th>
                    <Th>ack</Th>
                    </>
                }
            </Tr>
            {data.notices.map((notice: any, i: number) => 
                <Tr key={notice._id}>
                    <Td>{myDate(notice.timestamp)}</Td>
                    <Td>
                        {notice.message}
                    </Td>
                    { profile?.admin && <>
                        <Td>{notice.email}</Td>
                        <Td>
                            <Button onClick={() => solve(notice._id)}>risolto</Button>
                        </Td>
                        </>
                    }
                </Tr>
            )}
        </Table>}
    </>

    function solve(_id: string) {
        client.mutate({mutation: SOLVE_NOTICE, variables: {_id}, refetchQueries: ["GetNotices"]})
    }

}
  
const CREATE_NOTICE = gql`
mutation CreateNotice($message: String!) {
    createNotice(message: $message)   
}`

function CreateNotice() {
    const [message, setMessage] = useState('')
    const [createNotice] = useMutation(CREATE_NOTICE, {refetchQueries: ["GetNotices"]})
    const messages = [
        {
            value: "fine grani",
            message: "Sono finiti i grani!"
        }
    ]
    return <>
        <select className="mr-2" onChange={evt => setMessage(evt.target.value)}>
            <option value="">seleziona il messaggio</option>
            {messages.map(m => <option key={m.value} value={m.value} selected={message===m.value}>
                {m.message}
            </option>)}
        </select>
        <Button variant="danger" onClick={send} disabled={message===''}>
            crea segnalazione
        </Button>
    </>

    function send() {
        createNotice({variables: {message}})
        setMessage('')
    }
}