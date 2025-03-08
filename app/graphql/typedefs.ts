import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar Timestamp

  type Profile {
    email: String
    admin: Boolean
    authorized: Boolean
    codes: [String]
  }

  type Cost {
    timestamp: Timestamp
    cents: Int
  }

  type Transaction {
    _id: String
    count: Int
    amountCents: Int
    coffeeGrams: Int
    description: String
    email: String
    code: String
    timestamp: Timestamp
    cumulativeCount: Int
    cumulativeAmountCents: Int
    cumulativeCoffeeGrams: Int
  }

  type UserTransactions {
    email: String
    creditCents: Int
    count: Int
    coffeeGrams: Int
    timestamp: Timestamp
  }

  type User {
    _id: String
    email: String,
    admin: Boolean,
    authorized: Boolean,
    codes: [String]
  }

  type Balance {
    cents: Int
    count: Int
    grams: Int
  }

  type Notice {
    _id: String
    timestamp: Timestamp
    message: String
    solved: Boolean
    email: String
  }

  input UpdateUserInput {
    admin: Boolean
    authorized: Boolean
  }

  type Query {
    profile: Profile
    
    """
    cost of a coffee
    """
    cost: Int

    """
    cost of a coffee (history)
    """
    costHistory: [Cost]

    """
    credit of the currently logged in user (debit if negative)
    """
    credit: Balance
    
    """
    total balance (all users) (debit if negative)
    """
    balance: Balance
    
    """
    transactions of the currently logged in user
    """
    myTransactions: [Transaction]

    """
    all transactions
    """
    transactions(year: Int): [Transaction]

    """
    years with transaction
    """
    transactionYears: [Int]

    """
    transactions aggregated by users
    """
    userTransactions: [UserTransactions]

    users: [User]

    """
    notices
    """
    notices: [Notice]
  }

  type Mutation {
    """
    modificare il costo di un caffé
    richiede autenticazione admin
    """
    setCost(cents: Int!): Boolean    

    """
    addebita $count caffé
    richiede autenticazione
    """
    coffee(count: Int!): Boolean

    """
    crea o modifica una transazione
    richiede autenticazione admin
    """
    transaction(_id: String, timestamp: String, email: String, count: Int, amountCents: Int, coffeeGrams: Int, description: String): Boolean

    """
    addebita un caffé
    richiede token di autenticazione
    """
    card(code: String!): String

    """
    request a card pairing
    returns the time in milliseconds after which the card will be unpaired
    requires authentication
    """
    card_request_pairing: Int

    """
    remove card pairing
    """
    card_remove_pairing(code: String!): Boolean

    """
    crea una segnalazione
    """
    createNotice(message: String!): Boolean

    """
    risolvi una segnalazione
    """
    solveNotice(_id: String!): Boolean

    """ 
    modifica i dati di un utente
    """
    updateUser(_id: String!, data: UpdateUserInput): Boolean
  }`
