import { ApolloError } from '@apollo/client'

export default function Error({error}: {
    error: ApolloError
  }) {
    return <div>
      Error: {error.message}
    </div>
  }
  
