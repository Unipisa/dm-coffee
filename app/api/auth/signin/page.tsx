import { getProviders, signIn } from 'next-auth/react'

import LoginButton from '../../../components/LoginButton'
import package_json from '../../../../package.json'

export default async function Signin({}) {
    const providers = await getProviders(); // Fetch authentication providers
    const google = providers?.google

    if (google===undefined) {
        return <div>Google provider not available! t1 {JSON.stringify(providers)}</div>
    }

    return <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img className="mx-auto h-20 w-auto" src="https://unipisa.github.io/logo-matematica/svg/simbolo.svg" alt="dm" />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">dm-coffee</h2>
            <p className="text-center">
                Mantieni il conteggio dei tuoi caffé!
                <br />
                Usa le tue credenziali di ateneo per autenticarti con google.
            </p>
        </div>
        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <div>
                <LoginButton provider={google}>☕</LoginButton>
            </div>
            <p className="mt-10 text-center text-sm/6 text-gray-500">
                dm-coffee versione {package_json.version}
            </p>
        </div>
    </div>
    }
