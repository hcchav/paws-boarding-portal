import { NextRequest, NextResponse } from 'next/server';
import { checkAvailability } from '@/lib/calendar';
import { addMonths, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthsAhead = parseInt(searchParams.get('months') || '3'); // Default to 3 months ahead

    console.log(`🗓️ Fetching blackout dates for next ${monthsAhead} months`);

    const today = new Date();
    const endDate = addMonths(today, monthsAhead);
    const startDateStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDateStr = format(endOfMonth(endDate), 'yyyy-MM-dd');

    // Get all events from Google Calendar for the date range
    const availability = await checkAvailability(startDateStr, endDateStr);
    
    // For this API, we want to return the dates that are NOT available
    // We'll check each day individually to build a comprehensive blackout list
    const blackoutDates: string[] = [];
    
    // Generate all days in the range and check each one
    const allDays = eachDayOfInterval({
      start: startOfMonth(today),
      end: endOfMonth(endDate)
    });

    console.log(`🔍 Checking ${allDays.length} individual days for availability`);

    // Check each day individually (this is more granular than the booking check)
    for (const day of allDays) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const nextDayStr = format(new Date(day.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      try {
        const dayAvailability = await checkAvailability(dayStr, nextDayStr);
        if (!dayAvailability.isAvailable) {
          blackoutDates.push(dayStr);
        }
      } catch (error) {
        console.error(`Error checking availability for ${dayStr}:`, error);
        // If there's an error checking a specific day, mark it as blackout for safety
        blackoutDates.push(dayStr);
      }
    }

    console.log(`📅 Found ${blackoutDates.length} blackout dates`);

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
