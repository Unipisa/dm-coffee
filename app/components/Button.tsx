import { useState } from 'react'

export default function Button({ children, onClick, variant, disabled }:{
    children?: React.ReactNode,
    onClick?: any,
    variant?: 'default' | 'danger' | 'alert',
    disabled?: boolean
}) {
    const [busy, setBusy] = useState(false)
    const className = {
        default: 'text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
        danger: 'text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800',
        alert: 'text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800',
    }[variant || 'default']
    return <button 
        type="button" 
        className={className}
        onClick={myClick}
        disabled={busy || !onClick}>
        {children}
    </button>

    function myClick(evt: any) {
        if (onClick) {
            const ret = onClick(evt)
            if (ret instanceof Promise) {
                setBusy(true)
                ret.finally(() => setBusy(false))
            }
        }
    }
}