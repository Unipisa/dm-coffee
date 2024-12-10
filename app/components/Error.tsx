import { ApolloError } from '@apollo/client'

export default function Error({error}: {
    error: ApolloError|string
  }) {
    const message = error instanceof ApolloError ? error.message : error
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      Error: {message}
    </div>
  }
  
