"use client"
import './globals.css'; // Import global styles if you have them

import Provider from './components/Provider'
import Credit from './components/Credit'
import Balance from './components/Balance'
import Transactions from './components/Transactions'
import CoffeeForm from './components/CoffeeForm'

export default function Home() {
  return <Provider>
      <Dashboard />
  </Provider>
}

function Dashboard() {
  return <main>
    <CoffeeForm />
    <Balance />
    <Credit />
    <Transactions />
  </main>
}

