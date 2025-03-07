export default function Td({children, className}:{ children?: React.ReactNode, className?: string }) {
    return <td scope="col" className={"border-0 text-sm px-2 py-4 " + className}>
        {children}
    </td>
}