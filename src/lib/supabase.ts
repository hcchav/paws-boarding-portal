import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for booking request (matching the database structure)
export interface BookingRequestData {
  parent_name: string;
  email: string;
  phone?: string | null;
  dog_name: string;
  dog_breed?: string | null;
  dog_age?: number | null;
  start_date: string;
  end_date: string;
  is_vip: boolean;
  status: string;
  notes?: string | null;
  slack_message_ts?: string | null;
}

// Create a new booking request
export async function createBookingRequest(bookingData: BookingRequestData): Promise<{ id: string; [key: string]: unknown }> {
  try {
    // Use the is_vip field directly since it's already boolean
    const isVipBoolean = bookingData.is_vip;

    const { data, error } = await supabase
      .from('paws_booking_requests')
      .insert([
        {
          parent_name: bookingData.parent_name,
          email: bookingData.email,
          phone: bookingData.phone,
          dog_name: bookingData.dog_name,
          dog_breed: bookingData.dog_breed,
          dog_age: bookingData.dog_age,
          start_date: bookingData.start_date,
          end_date: bookingData.end_date,
          is_vip: isVipBoolean,
          status: bookingData.status,
          notes: bookingData.notes,
          slack_message_ts: bookingData.slack_message_ts,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating booking request:', error);
      throw new Error(`Failed to create booking request: ${error.message}`);
    }

    return data; // Return the data directly, not wrapped in success object
  } catch (error) {
    console.error('Error in createBookingRequest:', error);
    throw error;
  }
}

// Check if customer is VIP based on email or previous bookings
export async function checkVipCustomer(email: string): Promise<boolean> {
  try {
    // Check if customer exists in VIP list
    const { data: vipData, error: vipError } = await supabase
      .from('paws_vip_customers')
      .select('*')
      .eq('email', email)
      .single();

    if (vipError && vipError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking VIP status:', vipError);
      throw new Error(`Failed to check VIP status: ${vipError.message}`);
    }

    // If found in VIP table, return true
    if (vipData) {
      return true;
    }

    // If not in VIP table, check booking history
    const { data: bookingHistory, error: bookingError } = await supabase
      .from('paws_booking_requests')
      .select('id, created_at, status')
      .eq('email', email)
      .eq('status', 'APPROVED');

    if (bookingError) {
      console.error('Error checking booking history:', bookingError);
      throw new Error(`Failed to check booking history: ${bookingError.message}`);
    }

    const completedBookings = bookingHistory?.length || 0;
    
    // Determine VIP status based on booking count (3+ completed bookings = VIP)
    return completedBookings >= 3;

  } catch (error) {
    console.error('Error in checkVipCustomer:', error);
    throw error;
  }
}

// Get detailed VIP information (separate function for when you need more details)
export async function getVipCustomerDetails(email: string) {
  try {
    // Check if customer exists in VIP list
    const { data: vipData, error: vipError } = await supabase
      .from('paws_vip_customers')
      .select('*')
      .eq('email', email)
      .single();

    if (vipError && vipError.code !== 'PGRST116') {
      console.error('Error checking VIP status:', vipError);
      throw new Error(`Failed to check VIP status: ${vipError.message}`);
    }

    // If found in VIP table, return VIP details
    if (vipData) {
      return { 
        isVip: true, 
        vipLevel: vipData.vip_level || 'standard',
        totalBookings: vipData.total_bookings || 0
      };
    }

    // If not in VIP table, check booking history
    const { data: bookingHistory, error: bookingError } = await supabase
      .from('paws_booking_requests')
      .select('id, created_at, status')
      .eq('email', email)
      .eq('status', 'APPROVED');

    if (bookingError) {
      console.error('Error checking booking history:', bookingError);
      throw new Error(`Failed to check booking history: ${bookingError.message}`);
    }

    const completedBookings = bookingHistory?.length || 0;
    
    // Determine VIP status based on booking count
    const isVip = completedBookings >= 3; // 3+ completed bookings = VIP
    const vipLevel = completedBookings >= 10 ? 'premium' : 
                    completedBookings >= 5 ? 'gold' : 'standard';

    return {
      isVip,
      vipLevel: isVip ? vipLevel : null,
      totalBookings: completedBookings
    };

  } catch (error) {
    console.error('Error in getVipCustomerDetails:', error);
    throw error;
  }
}

// Additional utility functions
export async function getBookingRequestById(id: string) {
  try {
    const { data, error } = await supabase
      .from('paws_booking_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to get booking request: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in getBookingRequestById:', error);
    throw error;
  }
}

export async function updateBookingStatus(id: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('paws_booking_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking status: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    throw error;
  }
}