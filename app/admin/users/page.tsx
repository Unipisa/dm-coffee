"use client"
import { useQuery, gql, useMutation } from '@apollo/client'
import { useState } from 'react'

import Provider from '../../components/Provider'
import Loading from '../../components/loading'
import Error from '../../components/Error'
import {myDate, myTime} from '../../utils'

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
      <table>
        <thead>
            <tr>
                <th>email</th>
                <th>#</th>
                <th>€</th>
                <th>data</th>
            </tr>
        </thead>
        <tbody>
            {data.users.map((user: any, i: number) => 
                <tr key={i}>
                    <td>{user.email}</td>
                    <td align="right">{user.count}</td>
                    <td align="right">{(user.creditCents/100).toFixed(2)}€</td>
                    <td align="right">{myDate(user.timestamp)}</td>
                </tr>
            )}
        </tbody>
      </table>
    </>
}