import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBookingRequest, checkVipCustomer } from '@/lib/supabase';
import { checkAvailability } from '@/lib/calendar';

// Validation schema for booking request
const bookingRequestSchema = z.object({
  parentName: z.string().min(1, 'Parent name is required'),
  dogName: z.string().min(1, 'Dog name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  dogBreed: z.string().optional(),
  dogAge: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  notes: z.string().optional(),
});

// Helper function to validate booking rules
function validateBookingRules(startDate: string, endDate: string): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const startDay = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const endDay = end.getDay();
  
  // Check if it's a weeknight booking (Mon-Thu)
  const isWeeknight = startDay >= 1 && startDay <= 4 && endDay >= 1 && endDay <= 4;
  
  // Check if it's a valid weekend package (Fri-Mon)
  const isValidWeekend = startDay === 5 && endDay === 1; // Friday to Monday
  
  if (!isWeeknight && !isValidWeekend) {
    return 'Bookings are only allowed for weeknights (Mon-Thu) or weekend packages (Fri-Mon only).';
  }
  
  return null;
}

// Helper function to check calendar availability using Google Calendar API
async function checkCalendarAvailability(startDate: string, endDate: string): Promise<boolean> {
  try {
    console.log(`Checking Google Calendar availability for ${startDate} to ${endDate}`);
    
    // Use the real Google Calendar integration
    const availability = await checkAvailability(startDate, endDate);
    
    console.log(`Calendar availability result:`, availability);
    
    return availability.isAvailable;
  } catch (error) {
    console.error('Calendar availability check failed:', error);
    
    // In case of calendar API failure, we'll be conservative and assume not available
    // This prevents overbooking if there's a technical issue
    return false;
  }
}

// Helper function to send Slack notification (placeholder for now)
async function sendSlackNotification(bookingData: any): Promise<string | null> {
  // TODO: Implement Slack integration
  console.log('Sending Slack notification for booking:', bookingData.id);
  
  // For now, return a mock message timestamp
  return `mock_ts_${Date.now()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request data
    const validationResult = bookingRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Validate booking rules
    const ruleError = validateBookingRules(data.startDate, data.endDate);
    if (ruleError) {
      return NextResponse.json(
        { error: ruleError },
        { status: 400 }
      );
    }

    // Additional date validations
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return NextResponse.json(
        { error: 'Start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check if customer is VIP
    const isVip = await checkVipCustomer(data.email);
    console.log(`VIP check for ${data.email}: ${isVip}`);

    // Check calendar availability
    const isAvailable = await checkCalendarAvailability(data.startDate, data.endDate);
    console.log(`Calendar availability: ${isAvailable}`);

    // Determine booking status
    let status: 'PENDING' | 'APPROVED' | 'DENIED' | 'AUTO_APPROVED';
    let slackMessageTs: string | null = null;

    if (!isAvailable) {
      // No availability - deny the request
      status = 'DENIED';
    } else if (isVip) {
      // VIP customer with availability - auto-approve
      status = 'AUTO_APPROVED';
    } else {
      // Regular customer with availability - send to Slack for approval
      status = 'PENDING';
    }

    // Prepare booking data for database
    const bookingData = {
      parent_name: data.parentName,
      email: data.email,
      phone: data.phone || null,
      dog_name: data.dogName,
      dog_breed: data.dogBreed || null,
      dog_age: data.dogAge ? parseInt(data.dogAge) : null,
      start_date: data.startDate,
      end_date: data.endDate,
      is_vip: isVip,
      status: status,
      notes: data.notes || null,
      slack_message_ts: null,
    };

    // Create booking request in database
    const booking = await createBookingRequest(bookingData);
    console.log('Booking created:', booking.id);

    // Send Slack notification for pending requests
    if (status === 'PENDING') {
      try {
        slackMessageTs = await sendSlackNotification(booking);
        if (slackMessageTs) {
          // Update booking with Slack message timestamp
          // We'll implement updateBookingStatus later when we add Slack integration
          console.log('Slack notification sent:', slackMessageTs);
        }
      } catch (error) {
        console.error('Failed to send Slack notification:', error);
        // Don't fail the entire request if Slack fails
      }
    }

    // Return response based on status
    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      status: status,
      message: getStatusMessage(status, isVip),
    });

  } catch (error) {
    console.error('Booking request error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string, isVip: boolean): string {
  switch (status) {
    case 'AUTO_APPROVED':
      return 'Your booking has been automatically approved! You\'ll receive a confirmation email shortly.';
    case 'PENDING':
      return 'Your booking request has been submitted and is awaiting approval. We\'ll notify you within 2-4 hours.';
    case 'DENIED':
      return 'Unfortunately, we don\'t have availability for your requested dates. Please try different dates.';
    default:
      return 'Your booking request has been processed.';
  }
}
