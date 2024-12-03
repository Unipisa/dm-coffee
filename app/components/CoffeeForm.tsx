"use client"
import { useState } from 'react'
import { gql, useMutation } from '@apollo/client';

import Button from './Button'

const COFFEE = gql`
  mutation PostMutation($count: Int!) {
    coffee(count: $count)
  }`

export default function CoffeeForm() {
  const [count, setCount] = useState(1)
  const [submitCoffee, coffeeMutation] = useMutation(COFFEE, {
    refetchQueries: ["GetCredit", "GetMyTransactions", "GetBalance"]
  })

  return <form>
    <div className="grid gap-6 mb-6 md:grid-cols-1">
      <div className='flex justify-center space-x-2'>
        <Button variant='secondary' disabled={count <= 1}onClick={() => setCount(count => count - 1)}>
          -
        </Button>
      <Button onClick={() => submitCoffee({ variables: { count } })}>
        Registra {count} caffè
      </Button>
      <Button variant='secondary' onClick={() => setCount(count => count + 1)}>
          +
        </Button>
      </div>
    </div>
  </form>
}