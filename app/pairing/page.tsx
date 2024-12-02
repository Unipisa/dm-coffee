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
      return <div>Hai associato la tessera {profile.code}. <Button variant="alert" onClick={removePairing}>disaccoppia!</Button></div>
    } else return <PairingRequest />
}
  
function PairingRequest({}) {
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
      <p>Non hai associato nessuna tessera.</p>
      <p>Se hai una tessera e sei in sala caffé premi il pulsante {}
      <Button onClick={() => submitPairing()}>
        associazione tessera
      </Button> 
      </p>
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