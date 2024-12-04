"use client"
import { useQuery, gql, useMutation } from '@apollo/client'
import { useState } from 'react'

import Provider from '../../components/Provider'
import Loading from '../../components/Loading'
import Error from '../../components/Error'
import Amount from '../../components/Amount'
import {myDate, myTime} from '../../utils'
import Table from '../../components/Table'
import Thead from '../../components/Thead'
import Th from '../../components/Th'
import Tr from '../../components/Tr'
import Td from '../../components/Td'

export default function UsersPage({}) {
    return <Provider>
        <Users />
    </Provider>
}

const GET_USERS = gql`
query GetUsers {
  users {
    email
    creditCents
    timestamp
    count
  }
}`

function Users() {
    const {loading, error, data} = useQuery(GET_USERS)
    if (loading) return <Loading />
    if (error) return <Error error={error}/>
    return <>
      <Table>
        <Thead>
            <tr>
                <Th className="text-left">email</Th>
                <Th className="text-right">#</Th>
                <Th className="text-right">€</Th>
                <Th className="text-left">data</Th>
            </tr>
        </Thead>
        <tbody>
            {data.users.map((user: any, i: number) => 
                <Tr key={i}>
                    <Td>{user.email}</Td>
                    <Td className="text-right">{user.count||""}</Td>
                    <Td className="text-right"><Amount cents={user.creditCents}/></Td>
                    <Td className="text-left">{myDate(user.timestamp)}</Td>
                </Tr>
            )}
        </tbody>
      </Table>
    </>
}