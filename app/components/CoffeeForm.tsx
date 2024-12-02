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
      <div>
        <label
          htmlFor="count"
          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            quanti caffé?
        </label>
        <select 
          id="count" 
          className="bg-gray-50 text-xl border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          style={{textAlignLast: 'center'}}
          value={count}
          onChange={e => setCount(parseInt(e.target.value))}
          >
          <option>1</option>
          <option>2</option>
          <option>3</option>
          <option>4</option>
          <option>5</option>
          <option>6</option>
          <option>7</option>
          <option>8</option>
          <option>9</option>
          <option>10</option>
        </select>
      </div>
      <Button onClick={() => submitCoffee({ variables: { count } })}>
        submit!
      </Button>
    </div>
  </form>
}