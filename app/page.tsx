"use client"
import { useState } from 'react'

export default function Home() {
  const [code, setCode] = useState('12345')
  const [count, setCount] = useState(1)

  return <main>
    <h1>dm-coffee</h1>
    <form>
      <div className="grid gap-6 mb-6 md:grid-cols-1">
        <div>
            <label 
              htmlFor="code" 
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                codice
            </label>
            <input 
              type="text" 
              id="code" 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              placeholder="codice" 
              value={code}
              onChange={e => setCode(e.target.value)}
              required />
        </div>      
        <div>
          <label
            htmlFor="count"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              numero
          </label>
          <select 
            id="count" 
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
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
      <button 
        type="submit" 
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        onClick={submit}
      >
        submit!
      </button>
    </div>
    </form>
  </main>

  async function submit(e) {
    e.preventDefault()
    const query = `
      mutation  PostMutation($code: String!, $count: Int!) {
        post(code: $code, count: $count)
      }`

    const variables = { code, count }
    
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({query, variables})
    }

    const response = await fetch('/graphql', requestOptions)

    if (!response.ok) {
      throw new Error(`connection error: ${response.statusText}`)
    }
      
    const data = await response.json()
  }
}
