import {Temporal} from '@js-temporal/polyfill'

export function myDateTime(isoTimestamp: string|undefined|null) {
    if (isoTimestamp === undefined) return '???'
    if (isoTimestamp === null) return '---'

    const instant = Temporal.Instant.from(isoTimestamp)
    const zonedDateTime = instant.toZonedDateTimeISO('Europe/Rome')
    const {day, month, year, hour, minute} = zonedDateTime
    return `${day}.${month}.${year} ${hour}:${String(minute).padStart(2, '0')}`
}  
  
export function myDate(isoTimestamp: string|undefined|null) {
    if (isoTimestamp === undefined) return '???'
    if (isoTimestamp === null) return '---'
  
    const instant = Temporal.Instant.from(isoTimestamp)
    const zonedDateTime = instant.toZonedDateTimeISO('Europe/Rome')
    const {day, month, year} = zonedDateTime
    return `${day}.${month}.${year}`
}  
  
export function myTime(isoTimestamp: string|undefined|null) {
    if (isoTimestamp === undefined) return '???'
    if (isoTimestamp === null) return '---'
  
    const instant = Temporal.Instant.from(isoTimestamp)
    const zonedDateTime = instant.toZonedDateTimeISO('Europe/Rome')
    const {hour, minute} = zonedDateTime
    return `${hour}:${String(minute).padStart(2, '0')}`
}