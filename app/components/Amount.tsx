export default function Amount({cents,prefix}:{
    cents:number,
    prefix?:string
}) {
    return <b className={cents<0?"text-red-500":"text-blue-500"}>{prefix} {(cents/100).toFixed(2)}</b>
}