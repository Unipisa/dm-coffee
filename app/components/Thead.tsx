export default function Thead({children}:{ children: React.ReactNode }) {
    return <thead className='border-t-2 border-gray-300 text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 text-align-left'>
        {children}
    </thead>
}