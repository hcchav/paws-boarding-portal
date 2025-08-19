import { google } from 'googleapis'
import { parseISO, format } from 'date-fns'

// Initialize Google Calendar API
function getCalendarClient() {
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

export async function checkAvailability(
  startDate: string,
  endDate: string
): Promise<AvailabilityCheck> {
  try {
    const calendar = getCalendarClient()
    const calendarId = process.env.GOOGLE_CALENDAR_ID!

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

    const events = response.data.items || []
    
    if (events.length === 0) {
      return { isAvailable: true }
    }

    // Check for conflicts
    const conflictingEvents = events
      .filter(event => {
        // Skip all-day events that might be availability blocks
        if (event.start?.date && event.end?.date) {
          return false
        }
        return true
      })
      .map(event => event.summary || 'Unnamed event')

    return {
      isAvailable: conflictingEvents.length === 0,
      conflictingEvents: conflictingEvents.length > 0 ? conflictingEvents : undefined
    }
  } catch (error) {
    console.error('Calendar availability check failed:', error)
    // In case of error, assume not available for safety
    return {
      isAvailable: false,
      conflictingEvents: ['Calendar check failed - please try again']
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
