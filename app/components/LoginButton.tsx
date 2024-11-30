"use client";

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function SignInButton({ provider, children } : {
    provider: {
        id: string,
    },
    children: React.ReactNode
}) {
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") || "/"

    return <div className="mb-2">
        <button onClick={() => signIn(provider.id, { callbackUrl })}
            className="flex w-full justify-center rounded-md bg-myBlue px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-myBlue-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-myBlue-dark"
            >
            {children}
        </button>
    </div>
}