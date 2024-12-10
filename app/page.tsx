"use client"
import './globals.css'; // Import global styles if you have them

import Provider from './components/Provider'
import Credit from './components/Credit'
import Balance from './components/Balance'
import Transactions from './components/Transactions'
import CoffeeForm from './components/CoffeeForm'
import { useProfile } from './components/Provider'

import Error from './components/Error'

export default function Home() {
  return <Provider>
      <Dashboard />
  </Provider>
}

function Dashboard() {
  const profile = useProfile()
  return <main>
    { profile && !profile.authorized && <Error error={`email ${profile.email} non autorizzato`} /> }
    <CoffeeForm />
    <div className='flex justify-between'>
      <Credit />
      <div className="hidden sm:block"><Balance /></div>
    </div>
    <Transactions />
  </main>
}

