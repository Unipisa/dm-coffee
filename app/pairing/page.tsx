"use client"
import {useState} from 'react'
import {useMutation, gql, useApolloClient} from '@apollo/client'


import Provider, {useProfile} from '../components/Provider'
import Button from '../components/Button'
import Loading from '../components/Loading'
import Error from '../components/Error'

export default function PairingPage() {
    return <Provider>
        <Pairing />
    </Provider>
}

const REQUEST_PAIRING = gql`
  mutation RequestPairing {
    card_request_pairing
  }`

const REMOVE_PAIRING = gql`
  mutation RemovePairing {
    card_remove_pairing
  }`

function Pairing({}) {
    const profile = useProfile()
    const [ removePairing, {}] = useMutation(REMOVE_PAIRING, {refetchQueries: ["GetProfile"]}) 
    if (profile?.code) {
      return <>
        <h2 className="mt-2">Tessera associata</h2>
        <div>Codice tessera: <span className="font-bold">{profile.code}</span>. 
        <br />
        <Button variant="alert" onClick={removePairing}>Rimuovi associazione</Button></div>
      </>
    } else return <PairingRequest />
}
  
function PairingRequest({}) {
    const profile = useProfile()
    const [submitPairing, {loading, error, data}] = useMutation(REQUEST_PAIRING,{
      onCompleted: completed})
    const [countdown, setCountdown] = useState(0)
    const client = useApolloClient()
    if (loading) return <Loading />
    if (error) return <Error error={error} />
    if (countdown > 0) {
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
      const id = setInterval(() => {
        setCountdown(c => c - 1)
        client.refetchQueries({ include: ["GetProfile"] })
      }, 1000)
      setTimeout(() => {
        clearInterval(id),
        setCountdown(0)
      }, milliseconds)
    }
  }