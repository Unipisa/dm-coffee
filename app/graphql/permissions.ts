import { User, Context } from './types'
import config from '../config'
import { isPermittedEmail } from '../utils'

/**
 * @param context 
 * @returns user object if authenticated 
 * @throws error if not authenticated
 */
export function requireAuthenticatedUser(context: Context) {
    const user = context?.user
    if (!user) throw new Error("not logged in")
    return user 
  }
  
  /**
   * @param context 
   * @returns user object if authenticated and email is permitted by configuration
   * @throws error if not authenticated or email is not permitted
   */
  export function requirePermittedUser(context: Context) {
    const user = requireAuthenticatedUser(context)
    if (!isPermittedEmail(user?.email)) throw new Error("email not permitted")
    return user
  }
  
  /**
   * @param context 
   * @returns user object if authenticated and email is in the list of admins
   * @throws error if not authenticated or email is not in the list of admins
   */
  export function requireAdminUser(context: Context): User {
    const authorization = context.req.headers.get('authorization')
    if (authorization && !Array.isArray(authorization) && config.ADMIN_SECRET_TOKENS.split(',').includes(authorization)) {
      return { email: 'admin', name: 'request with authorization token', picture: '', id: 'unknown_admin', admin: true }
    }
  
    const user = requireAuthenticatedUser(context)
    if (!user.admin) throw new Error("not admin")
    return user
  }
  
  export function requireCardAuthentication(context: Context): User {
    const authorization = context.req.headers.get('authorization')
    if (authorization && !Array.isArray(authorization) && config.CARD_SECRET_TOKENS.split(',').includes(authorization)) {
      return { email: 'card', name: 'request with authorization token', picture: '', id: 'unknown_card', admin: false }
    }
    throw new Error("not card user")
  }
  
  
  