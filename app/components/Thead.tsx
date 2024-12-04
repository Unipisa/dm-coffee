export default function Thead({children}:{ children: React.ReactNode }) {
    return <thead className='border-y-2 border-gray-400 text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 text-align-left'>
        {children}
    </thead>
}