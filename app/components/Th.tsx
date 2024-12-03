export default function Th({children, className}:{ children: React.ReactNode, className?: string }) {
    return <th className={"px-2 py-3 " + className}>
        {children}
    </th>
}