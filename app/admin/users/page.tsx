"use client"
import {useState} from 'react'
import { useQuery, useMutation, gql } from '@apollo/client'

import Provider from '../../components/Provider'
import Loading from '../../components/Loading'
import Error from '../../components/Error'
import Amount from '../../components/Amount'
import {myDate} from '../../utils'
import Table from '../../components/Table'
import Thead from '../../components/Thead'
import Th from '../../components/Th'
import Tr from '../../components/Tr'
import Td from '../../components/Td'
import Button from '../../components/Button'

export default function UsersPage({}) {
    return <Provider>
        <Users />
    </Provider>
}

const GET_USER_TRANSACTIONS = gql`
query GetUserTransactions {
  userTransactions {
    email
    count
    creditCents
    coffeeGrams
    timestamp
  }
}`

const GET_USERS = gql`
query GetUsers {
  users {
    _id
    email
    admin
    authorized
    codes
    }
}`

function Users() {
    const {loading: loadingTransactions, error: errorTransactions, data: dataTransactions} = useQuery(GET_USER_TRANSACTIONS)
    const {loading: loadingUsers, error: errorUsers, data: dataUsers} = useQuery(GET_USERS)
    const [edit, setEdit] = useState(false)
    if (loadingTransactions || loadingUsers) return <Loading />
    if (errorTransactions) return <Error error={errorTransactions}/>
    if (errorUsers) return <Error error={errorUsers}/>

    const userDict = dataUsers.users.reduce((acc: any, user: any) => {
        acc[user.email] = {user}
        return acc
    } , {})

    dataTransactions.userTransactions.forEach((transactions: any) => {
        if (userDict[transactions.email]) {
            userDict[transactions.email].transactions = transactions
        } else {
            userDict[transactions.email] = {transactions}
        }
    })

    return <>
      {edit
        ? <a className="ml-auto" href="#" onClick={() => setEdit(false)}>
          termina modifiche
          </a>
        :<a className="ml-auto" href="#" onClick={() => setEdit(true)}>
          modifica
          </a>
      }
      <Table>
        <Thead>
            <tr>
                <Th className="text-left">email</Th>
                <Th className="text-left">cards</Th>
                <Th className="text-right">#</Th>
                <Th className="text-right">€</Th>
                <Th className="text-right">g</Th>
                <Th className="text-left">data</Th>
                <Th className="text-left">logged</Th>
                <Th className="text-left">authorized</Th>
                <Th className="text-left">admin</Th>
            </tr>
        </Thead>
        <tbody>
            {Object.keys(userDict).sort().map(email => ({email, ...userDict[email]})).map(({ email, user, transactions }: any) => 
                <Tr key={email}>
                    <Td>{email}</Td>
                    <Td>{user?.codes?.join(", ")}</Td>
                    <Td className="text-right">{transactions?.count||""}</Td>
                    <Td className="text-right">{transactions && <Amount cents={transactions.creditCents}/>}</Td>
                    <Td className="text-right">{transactions?.coffeeGrams||""}</Td>
                    <Td className="text-left">{transactions && myDate(transactions.timestamp)}</Td>
                    <Td className="text-left">{user?"✅":""}</Td>
                    <Td className="text-left">
                      {!edit && user?.authorized?"✅":""}
                      {edit && user?._id && <UpdateAuthorizedButton user={user} />}
                    </Td>
                    <Td className="text-left">
                      {!edit && user?.admin?"✅":""}
                      {edit && user?._id && <UpdateAdminButton user={user} />}
                    </Td>
                </Tr>
            )}
        </tbody>
      </Table>
    </>
}

const UPDATE_USER = gql`
mutation UpdateUser($_id: String!, $data: UpdateUserInput) {
  updateUser(_id: $_id, data: $data)
}`

function UpdateAdminButton({user}:{user: {_id: string, admin: Boolean}}) {
  const [updateUser, {data, loading, error}] = useMutation(UPDATE_USER, {
      refetchQueries: ["GetUserTransactions", "GetUsers"]
  })
  return user.admin 
    ? <Button onClick={() => updateUser({variables: {_id: user._id, data: {admin: false}}})}>
      remove admin
    </Button> 
    :<Button onClick={() => updateUser({variables: {_id: user._id, data: {admin: true}}})}>
      make admin
    </Button>
}

function UpdateAuthorizedButton({user}:{user: {_id: string, authorized: Boolean}}) {
  const [updateUser, {data, loading, error}] = useMutation(UPDATE_USER, {
      refetchQueries: ["GetUserTransactions", "GetUsers"]
  })
  return user.authorized 
    ? <Button onClick={() => updateUser({variables: {_id: user._id, data: {authorized: false}}})}>
      remove authorization
    </Button> 
    :<Button onClick={() => updateUser({variables: {_id: user._id, data: {authorized: true}}})}>
      give authorization
    </Button>
}
