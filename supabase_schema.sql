-- Database creation script for lovina-dolphin-tours
-- Paste this script inside your Supabase project's SQL Editor to set up the schema.

-- 1. Bookings Table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_code TEXT NOT NULL UNIQUE,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  whatsapp_number TEXT NOT NULL,
  guest_phone TEXT,
  date TEXT NOT NULL, -- Stored as YYYY-MM-DD text for consistency
  guests INTEGER NOT NULL,
  tour_id TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_description TEXT NOT NULL,
  hotel_details TEXT,
  assigned_captain TEXT DEFAULT 'PENDING',
  captain_phone TEXT,
  rules_signed TEXT DEFAULT 'PENDING',
  signature_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable indexes for bookings
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_bookings_date ON bookings(date);

-- 2. Captains Table
CREATE TABLE captains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captain_name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable indexes for captains
CREATE INDEX idx_captains_priority ON captains(priority);

-- 3. Populate default test captain
INSERT INTO captains (captain_name, whatsapp_number, priority) 
VALUES ('Wayan', '+6281234567890', 1)
ON CONFLICT DO NOTHING;
