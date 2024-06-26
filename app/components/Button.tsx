import { useState } from 'react'

export default function Button({ children, onClick, variant, disabled }:{
    children?: React.ReactNode,
    onClick?: any,
    variant?: 'default' | 'danger' | 'alert',
    disabled?: boolean
}) {
    const [busy, setBusy] = useState(false)
    const color = {
        default: 'blue',
        danger: 'red',
        alert: 'yellow' 
    }[variant || 'default']
    return <button 
        type="button" 
        className={`text-white bg-${color}-700 hover:bg-${color}-800 focus:ring-4 focus:outline-none focus:ring-${color}-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-${color}-600 dark:hover:bg-${color}-700 dark:focus:ring-${color}-800`}
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