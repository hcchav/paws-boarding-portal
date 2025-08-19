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

export function getBookingType(startDate: string, endDate: string): 'standard' | 'invalid' {
  try {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    
    // All valid date ranges are now considered 'standard'
    if (isAfter(end, start)) {
      return 'standard'
    }
    
    return 'invalid'
  } catch {
    return 'invalid'
  }
}
