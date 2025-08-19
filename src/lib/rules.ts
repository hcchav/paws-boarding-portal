import { format, isWeekend, getDay, parseISO, isBefore, isAfter, addDays } from 'date-fns'

export interface BookingValidation {
  isValid: boolean
  errors: string[]
}

export function validateBookingDates(startDate: string, endDate: string): BookingValidation {
  const errors: string[] = []
  
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    
    // Check if end date is after start date
    if (!isAfter(end, start)) {
      errors.push('End date must be after start date')
    }
    
    // Check if dates are in the future
    const today = new Date()
    if (isBefore(start, today)) {
      errors.push('Start date must be in the future')
    }
    
    const startDay = getDay(start) // 0 = Sunday, 1 = Monday, etc.
    const endDay = getDay(end)
    
    // Weekend package validation: Must be Fri → Mon
    if (isWeekend(start) || isWeekend(end)) {
      // If either date is weekend, it must be a Fri-Mon package
      if (!(startDay === 5 && endDay === 1)) { // Friday to Monday
        errors.push('Weekend packages must be Friday arrival to Monday departure only')
      }
    } else {
      // Weeknight validation: Mon-Thu only
      if (startDay === 0 || startDay === 6) { // Sunday or Saturday
        errors.push('Weeknight arrivals must be Monday through Thursday only')
      }
      if (endDay === 0 || endDay === 6) { // Sunday or Saturday  
        errors.push('Weeknight departures must be Monday through Thursday only')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid date format']
    }
  }
}

export function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
  } catch {
    return 'Invalid dates'
  }
}

export function getBookingType(startDate: string, endDate: string): 'weeknight' | 'weekend' | 'invalid' {
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    
    const startDay = getDay(start)
    const endDay = getDay(end)
    
    // Weekend package: Friday to Monday
    if (startDay === 5 && endDay === 1) {
      return 'weekend'
    }
    
    // Weeknight: Mon-Thu arrivals and departures
    if (startDay >= 1 && startDay <= 4 && endDay >= 1 && endDay <= 4) {
      return 'weeknight'
    }
    
    return 'invalid'
  } catch {
    return 'invalid'
  }
}
