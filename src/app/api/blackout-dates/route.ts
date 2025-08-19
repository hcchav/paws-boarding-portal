import { NextRequest, NextResponse } from 'next/server';
import { getCalendarClient } from '@/lib/calendar';
import { format, eachDayOfInterval, parseISO, addMonths, startOfMonth, endOfMonth } from 'date-fns';

interface CalendarEvent {
  start?: {
    date?: string | null;
    dateTime?: string | null;
  };
  end?: {
    date?: string | null;
    dateTime?: string | null;
  };
  summary?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get('months') || '3'); // Default to 3 months ahead

    console.log(`🗓️ Fetching blackout dates for next ${monthsAhead} months`);

    const today = new Date();
    const endDate = addMonths(today, monthsAhead);
    const startDateStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDateStr = format(endOfMonth(endDate), 'yyyy-MM-dd');

    // Single batch query to Google Calendar for the entire date range
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID!;

    console.log(`🔍 Batch querying calendar from ${startDateStr} to ${endDateStr}`);
    console.log(`📅 Using calendar ID: ${calendarId?.substring(0, 20)}...`);

    const timeMin = parseISO(startDateStr).toISOString();
    const timeMax = parseISO(endDateStr).toISOString();

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`📋 Found ${events.length} events in date range`);

    // Generate all days in the range
    const allDays = eachDayOfInterval({
      start: startOfMonth(today),
      end: endOfMonth(endDate)
    });

    // Build blackout dates by checking which days have events
    const blackoutDates: string[] = [];
    
    for (const day of allDays) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      // Check if any events overlap with this day
      const conflictingEvents: CalendarEvent[] = [];
      
      (events as CalendarEvent[]).forEach((event: CalendarEvent) => {
        if (!event.start || !event.end) return;

        let eventStart: Date;
        let eventEnd: Date;

        // Handle all-day events
        if (event.start.date) {
          eventStart = parseISO(event.start.date);
          eventEnd = parseISO(event.end!.date!);
          // All-day events end date is exclusive, so subtract 1 day
          eventEnd.setDate(eventEnd.getDate() - 1);
        } else if (event.start.dateTime) {
          // For timed events, we need to check if the event occurs on the local date
          // Parse the datetime and extract the local date portion
          const eventStartDateTime = new Date(event.start.dateTime);
          const eventEndDateTime = new Date(event.end!.dateTime!);
          
          // Create date objects using the local date components
          eventStart = new Date(eventStartDateTime.getFullYear(), eventStartDateTime.getMonth(), eventStartDateTime.getDate());
          eventEnd = new Date(eventEndDateTime.getFullYear(), eventEndDateTime.getMonth(), eventEndDateTime.getDate());
        } else {
          return; // Skip events without proper date/time
        }

        // Check if the event overlaps with the current day
        if (eventStart <= dayEnd && eventEnd >= dayStart) {
          conflictingEvents.push(event);
        }
      });

      if (conflictingEvents.length > 0) {
        blackoutDates.push(dayStr);
        console.log(`📅 Blackout date found: ${dayStr} (${conflictingEvents.length} events)`);
      }
    }

    console.log(`📅 Found ${blackoutDates.length} blackout dates: [${blackoutDates.join(', ')}]`);

    return NextResponse.json({
      success: true,
      blackoutDates,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      }
    });

  } catch (error) {
    console.error('Error fetching blackout dates:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch blackout dates',
        success: false,
        blackoutDates: [] // Return empty array so calendar still works
      },
      { status: 500 }
    );
  }
}
