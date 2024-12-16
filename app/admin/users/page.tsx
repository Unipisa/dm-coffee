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
    creditCents
    timestamp
    count
    _id
    admin
  }
}`

function Users() {
    const {loading, error, data} = useQuery(GET_USER_TRANSACTIONS)
    const [edit, setEdit] = useState(false)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
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
                <Th className="text-right">#</Th>
                <Th className="text-right">€</Th>
                <Th className="text-left">data</Th>
                <Th className="text-left">admin</Th>
            </tr>
        </Thead>
        <tbody>
            {data.userTransactions.map((user: any, i: number) => 
                <Tr key={i}>
                    <Td>{user.email}</Td>
                    <Td className="text-right">{user.count||""}</Td>
                    <Td className="text-right"><Amount cents={user.creditCents}/></Td>
                    <Td className="text-left">{myDate(user.timestamp)}</Td>
                    <Td className="text-left">
                      {!edit && user.admin?"✅":""}
                      {edit && user._id && <UpdateAdminButton user={user} />}
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
        refetchQueries: ["GetUserTransactions"]
    })
    return user.admin 
      ? <Button onClick={() => updateUser({variables: {_id: user._id, data: {admin: false}}})}>
        remove admin
      </Button> 
      :<Button onClick={() => updateUser({variables: {_id: user._id, data: {admin: true}}})}>
        make admin
      </Button>
}
