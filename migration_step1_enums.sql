-- STEP 1: Add New Enum Values
-- Run this first, then run step 2

-- Add new user roles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'telecalling_agent';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'visa_consultant';

-- Add new lead statuses
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'follow_up_required';

-- Create new enums
DO $$ BEGIN
    CREATE TYPE public.referral_status AS ENUM ('pending', 'accepted', 'declined', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.remark_type AS ENUM ('general', 'call_log', 'appointment_update', 'status_change', 'assignment_change');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;