export default function Table({children}:{ children: React.ReactNode }) {
    return <table className="border-0 lg:rounded-lg mt-2 table-auto overflow-x-auto shadow-md text-align-left">
        {children}
    </table>
}