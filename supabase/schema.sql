-- Supabase SQL Schema for Paws Boarding Portal
-- Based on the original Prisma schema from DEMO_PLAN.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE paws_request_status AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'AUTO_APPROVED');

-- Booking requests table (equivalent to Prisma Request model)
CREATE TABLE paws_booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parent_name TEXT NOT NULL,
    dog_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    dog_breed TEXT,
    dog_age INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_vip BOOLEAN DEFAULT FALSE,
    status paws_request_status DEFAULT 'PENDING',
    slack_message_ts TEXT,
    notes TEXT
);

-- VIP customers table (evolved from VipDog to be more comprehensive)
CREATE TABLE paws_vip_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    parent_name TEXT NOT NULL,
    dog_name TEXT,
    notes TEXT
);

-- Indexes for better performance
CREATE INDEX paws_idx_booking_requests_email ON paws_booking_requests(email);
CREATE INDEX paws_idx_booking_requests_status ON paws_booking_requests(status);
CREATE INDEX paws_idx_booking_requests_dates ON paws_booking_requests(start_date, end_date);
CREATE INDEX paws_idx_vip_customers_email ON paws_vip_customers(email);

-- Row Level Security (RLS) policies
ALTER TABLE paws_booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE paws_vip_customers ENABLE ROW LEVEL SECURITY;

-- Allow read access to booking requests (for admin dashboard if needed later)
CREATE POLICY "paws_allow_read_booking_requests" ON paws_booking_requests
    FOR SELECT USING (true);

-- Allow insert for new booking requests
CREATE POLICY "paws_allow_insert_booking_requests" ON paws_booking_requests
    FOR INSERT WITH CHECK (true);

-- Allow update for status changes (for approval/denial)
CREATE POLICY "paws_allow_update_booking_requests" ON paws_booking_requests
    FOR UPDATE USING (true);

-- Allow read access to VIP customers for checking VIP status
CREATE POLICY "paws_allow_read_vip_customers" ON paws_vip_customers
    FOR SELECT USING (true);

-- Sample VIP customers for testing
INSERT INTO paws_vip_customers (email, parent_name, dog_name, notes) VALUES
    ('vip@example.com', 'VIP Customer', 'Buddy', 'Long-time customer with auto-approval'),
    ('premium@example.com', 'Premium Client', 'Max', 'VIP status due to frequent bookings');

-- Sample booking request for testing
INSERT INTO paws_booking_requests (parent_name, dog_name, email, phone, start_date, end_date, is_vip, status) VALUES
    ('John Doe', 'Buddy', 'john@example.com', '555-0123', '2024-01-15', '2024-01-18', false, 'PENDING');
