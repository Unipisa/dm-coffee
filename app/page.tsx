"use client"
import './globals.css'; // Import global styles if you have them

import Provider from './components/Provider'
import Credit from './components/credit'
import Balance from './components/balance'
import Transactions from './components/transactions'
import CoffeeForm from './components/CoffeeForm'

export default function Home() {
  return <Provider>
      <Dashboard />
  </Provider>
}

function Dashboard() {
  return <main>
    <CoffeeForm />
    <Credit />
    <Balance />
    <Transactions />
  </main>
}

