"use client"
import {useState} from 'react'
import {useMutation, gql, useApolloClient} from '@apollo/client'


import Provider, {useProfile} from '../components/Provider'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Error from '../components/Error'
import { time } from 'console'

export default function PairingPage() {
    return <Provider>
        <Pairings />
    </Provider>
}

const REQUEST_PAIRING = gql`
  mutation RequestPairing {
    card_request_pairing
  }`

const REMOVE_PAIRING = gql`
  mutation RemovePairing($code: String!) {
    card_remove_pairing(code: $code)
  }`

function Pairings({}) {
    const profile = useProfile()
    const [removePairing, {loading}] = useMutation(REMOVE_PAIRING, {refetchQueries: ["GetProfile"]}) 
    if (loading || !profile) return <Loading />
    return <>
      { profile.codes.length > 0 && <h2 className="mt-2">Tessere associate</h2> }
      { profile.codes.map(code => (
        <div key={code}>Codice tessera: <span className="font-bold">{code}</span> {}
        <Button variant="alert" onClick={() => removePairing({ variables: { code } })}>Rimuovi associazione {code}</Button></div>
      ))}
      <PairingRequest codes={profile.codes}/>
    </>
}

function PairingRequest({codes}: {codes: string[]}) {
    const [submitPairing, {loading, error, data}] = useMutation(REQUEST_PAIRING,{
      onCompleted: completed})
    const [countdown, setCountdown] = useState(0)
    const [nCodes, setNCodes] = useState(codes.length)
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
    const client = useApolloClient()
    if (loading) return <Loading />
    if (error) return <Error error={error} />
    if (nCodes != codes.length) {
      setNCodes(codes.length)
      setCountdown(0)
      setTimeoutId(undefined)
    }
    if (timeoutId) {
      return <p>Passa la tessera sul lettore entro <b>{countdown}</b> secondi!</p>
    }
    return <>
      <h2 className="mt-2">Associare una nuova tessera</h2>
      <p>Puoi associare una nuova tessera al tuo account seguendo queste istruzioni:</p>
      <ul>
        <li className="ml-4 my-2">1. Recati in Sala Caffè</li>
        <li className="ml-4 my-2">2. Premi il pulsante <Button onClick={() => submitPairing()}>associazione tessera</Button></li>
        <li className="ml-4 my-2">3. Passa la tessera sul lettore per associarla.</li>
      </ul>
    </>
  
    function completed(data: {card_request_pairing: number}) {
      const milliseconds = data.card_request_pairing
      console.log(`milliseconds: ${milliseconds}`)
      setCountdown(Math.round(milliseconds/1000))
      const timeoutId = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timeoutId)
            setTimeoutId(undefined)
          }
          return c - 1
        })
        client.refetchQueries({ include: ["GetProfile"] })
      }, 1000)
      setTimeoutId(timeoutId)
    }
  }