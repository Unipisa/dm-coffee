import {Temporal} from '@js-temporal/polyfill'

import config from './config'

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

const PERMITTED_EMAIL_REGEX = new RegExp(config.PERMITTED_EMAIL_REGEX)
export function isPermittedEmail(email: string|null|undefined) {
    if (!email) return false
    return PERMITTED_EMAIL_REGEX.test(email)
}