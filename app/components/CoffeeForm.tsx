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
    <div className="grid gap-6 my-6 md:grid-cols-1">
      <div className='md:flex justify-between space-x-2'>
        
        <div className='my-4 hidden md:block'>
        <Button>
          <a className="no-underline text-white" href="https://bit.ly/DMcaffePaga">Ricarica: PayPal</a>
        </Button>
        </div>
        
        <div className='flex space-x-2 my-4'>
          <Button variant='secondary' disabled={count <= 1} onClick={() => setCount(count => count - 1)}>
            -
          </Button>
          <Button onClick={() => submitCoffee({ variables: { count } })}>
            Registra {count} caffè
          </Button>
          <Button variant='secondary' onClick={() => setCount(count => count + 1)}>
              +
          </Button>
        </div>

        <div className='mt-6 mb-1 md:hidden'>
          Ricarica il tuo credito:
        <Button>
          <a className="no-underline text-white" href="https://bit.ly/DMcaffePaga">PayPal</a>
        </Button>
        </div>

        <div className='md:my-4'>
        <Button>
          <a className="no-underline text-white" href="https://bit.ly/DMcaffePagaSatispay"><span className='hidden md:inline'>Ricarica: </span>Satispay</a>
        </Button>
        </div>
      </div>
    </div>
  </form>
}