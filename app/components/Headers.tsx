import { signOut } from 'next-auth/react'
import { Session } from 'next-auth'

import package_json from '../../package.json'

export default function Headers({session}:{
    session: Session
}) {
    return <nav className="bg-gray-200">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
                <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                    <img className="h-10 w-auto" src="https://unipisa.github.io/logo-matematica/svg/simbolo.svg" alt="dm-coffee" />
                    <div className="mx-1">
                        <div className="sm:hidden">
                            dm-coffee {}
                            <span className="text-[10px]">
                                {package_json.version}
                            </span>
                        </div>
                        <b>
                            {session?.user?.email}
                        </b>
                    </div>
                    <div className="hidden sm:ml-6 sm:block">
                        <div className="flex space-x-4 mt-2">
                        </div>
                    </div>
                </div>
                <div className="relative ml-3">
                <div>
                    <button 
                        onClick={() => signOut()}
                        type="button" 
                        className="relative flex rounded-full bg-yellow-400 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800" 
                        id="user-menu-button" 
                        aria-expanded="false" 
                        aria-haspopup="true">
                    <div className="p-3">
                        <b>
                            Esci 
                        </b> {}
                        (logout)
                    </div>
                    </button>
                </div>
                </div>
            </div>
        </div>
    </nav>
}