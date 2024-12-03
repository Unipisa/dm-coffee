export default function Tr({children, className, key}:{ children: React.ReactNode, className?: string, key?: any }) {
    return <tr key={key} className={"border-0 odd:bg-white odd:dark:bg-gray-900 even:bg-gray-100 even:dark:bg-gray-800 border-b dark:border-gray-700 " + className}>
        {children}
    </tr>
}