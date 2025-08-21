-- STEP 2: Create Tables and Add Columns
-- Run this AFTER step 1 has been executed and committed

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    referred_by UUID NOT NULL REFERENCES public.profiles(id),
    referred_to UUID REFERENCES public.profiles(id),
    referral_reason TEXT,
    status referral_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_remarks table for timeline functionality
CREATE TABLE IF NOT EXISTS public.lead_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    remark_text TEXT NOT NULL,
    remark_type remark_type DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS priority lead_priority DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_remarks ENABLE ROW LEVEL SECURITY;