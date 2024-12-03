import {useState} from 'react'
import { gql, useMutation } from '@apollo/client'

import Button from './Button'

const SAVE_COST = gql`
  mutation SetCost($cents: Int!) {
    setCost(cents: $cents)
  }`

export default function SetCost({value}:{
    value: number
}) {
    const [cost, setCost] = useState<number>(value)
    const [saveCost, costMutation] = useMutation(SAVE_COST, {
        refetchQueries: ["cost", "costHistory"]})

    return <>
        Nuovo costo (centesimi): 
        <input className="border mx-2" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))}/>
        <Button disabled={cost===value} onClick={save}>
            Salva
        </Button>
    </>

    async function save() {
        const variables = {
            cents: cost,
        }
        console.log(`SAVE ${JSON.stringify(variables)}`)
        await saveCost({ variables })
    }
}