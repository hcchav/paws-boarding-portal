import { google } from 'googleapis'
import { parseISO, format } from 'date-fns'

// Initialize Google Calendar API
export function getCalendarClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  })

  return google.calendar({ version: 'v3', auth })
}

export interface AvailabilityCheck {
  isAvailable: boolean
  conflictingEvents?: string[]
}

export async function checkAvailability(startDate: string, endDate: string): Promise<{ isAvailable: boolean; conflictingEvents?: string[] }> {
  try {
    const calendar = getCalendarClient()
    const calendarId = process.env.GOOGLE_CALENDAR_ID!

    console.log(`🔍 Checking calendar availability for ${startDate} to ${endDate}`)
    console.log(`📅 Using calendar ID: ${calendarId?.substring(0, 20)}...`)

    // Convert dates to ISO format for Google Calendar API
    const timeMin = parseISO(startDate).toISOString()
    const timeMax = parseISO(endDate).toISOString()

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events: unknown[] = response.data.items || [];
    
    if (events.length === 0) {
      return { isAvailable: true }
    }

    // Treat any event (including all-day) as a conflict
    const conflictingEvents = (events as { summary?: string }[])
      .map(event => event.summary || 'Unnamed event')

    return {
      isAvailable: conflictingEvents.length === 0,
      conflictingEvents: conflictingEvents.length > 0 ? conflictingEvents : undefined
    }
  } catch (error: unknown) {
    console.error('Calendar availability check failed:', error)
    const err = error as { message?: string; code?: number; status?: number };
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      status: err.status,
      calendarId: process.env.GOOGLE_CALENDAR_ID?.substring(0, 20) + '...'
    })
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Calendar check failed - please try again'
    if (err.code === 404) {
      errorMessage = 'Calendar not found - check GOOGLE_CALENDAR_ID configuration'
    } else if (err.code === 403) {
      errorMessage = 'Calendar access denied - check service account permissions'
    }
    
    // In case of error, assume not available for safety
    return {
      isAvailable: false,
      conflictingEvents: [errorMessage]
    }
  }
}

export async function formatAvailabilityMessage(
  startDate: string,
  endDate: string,
  availability: AvailabilityCheck
): Promise<string> {
  const dateRange = `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d, yyyy')}`
  
  if (availability.isAvailable) {
    return `✅ Available: ${dateRange}`
  } else {
    const conflicts = availability.conflictingEvents?.join(', ') || 'Unknown conflicts'
    return `❌ Not Available: ${dateRange}\nConflicts: ${conflicts}`
  }
}
