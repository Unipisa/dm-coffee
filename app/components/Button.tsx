import { useState } from 'react'

export default function Button({ children, onClick, variant, disabled }:{
    children?: React.ReactNode,
    onClick?: any,
    variant?: 'default' | 'danger' | 'alert' | 'secondary',
    disabled?: boolean
}) {
    const [busy, setBusy] = useState(false)
    const className = {
        default: 'text-white bg-myBlue hover:bg-myBlue-dark focus:ring-4 focus:outline-none focus:ring-myBlue-light font-medium rounded-lg w-full text-sm sm:w-auto px-5 py-2.5 text-center',
        danger: 'text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800',
        alert: 'text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800',
        secondary: 'border-2 bg-gray-100 hover:bg-gray-300 focus:ring-4 focus:outline-none focus:ring-gray-500-light font-medium rounded-lg text-sm sm:w-auto px-5 py-2.5 text-center',
    }[variant || 'default']
    return <button 
        type="button" 
        className={className}
        onClick={myClick}
        disabled={disabled || busy || !onClick}>
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