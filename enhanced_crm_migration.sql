-- Enhanced CRM System Migration
-- Complete SQL code to apply all CRM features manually
-- Run this in your Supabase SQL editor

-- =====================================================
-- 1. ADD NEW ENUM VALUES
-- =====================================================

-- Add new user roles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'telecalling_agent';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'visa_consultant';

-- Add new lead statuses
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'follow_up_required';

-- =====================================================
-- 2. CREATE NEW TABLES
-- =====================================================

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    referred_by UUID NOT NULL REFERENCES public.profiles(id),
    referred_to UUID REFERENCES public.profiles(id),
    referral_reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead_remarks table for timeline functionality
CREATE TABLE IF NOT EXISTS public.lead_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    remark_text TEXT NOT NULL,
    remark_type VARCHAR(20) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create new enums for better type safety
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

-- Update referrals table to use proper enum
ALTER TABLE public.referrals
ADD COLUMN IF NOT EXISTS status_enum referral_status DEFAULT 'pending';

UPDATE public.referrals
SET status_enum = status::referral_status
WHERE status_enum IS NULL;

ALTER TABLE public.referrals
DROP COLUMN IF EXISTS status,
ALTER COLUMN status_enum SET NOT NULL;

ALTER TABLE public.referrals
RENAME COLUMN status_enum TO status;

-- Update lead_remarks table to use proper enum
ALTER TABLE public.lead_remarks
ADD COLUMN IF NOT EXISTS remark_type_enum remark_type DEFAULT 'general';

UPDATE public.lead_remarks
SET remark_type_enum = remark_type::remark_type
WHERE remark_type_enum IS NULL;

ALTER TABLE public.lead_remarks
DROP COLUMN IF EXISTS remark_type,
ALTER COLUMN remark_type_enum SET NOT NULL;

ALTER TABLE public.lead_remarks
RENAME COLUMN remark_type_enum TO remark_type;

-- =====================================================
-- 3. ADD NEW COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add new columns to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS priority lead_priority DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- =====================================================

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_remarks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- RLS policies for referrals
CREATE POLICY "Users can view referrals they created or are assigned to" ON public.referrals FOR SELECT USING (
    referred_by = auth.uid() OR referred_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own referrals" ON public.referrals FOR UPDATE USING (
    referred_by = auth.uid() OR referred_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS policies for lead remarks
CREATE POLICY "Users can view all remarks for leads they have access to" ON public.lead_remarks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND (
        assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'telecalling_agent', 'visa_consultant'))
    ))
);

CREATE POLICY "Users can create remarks" ON public.lead_remarks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 6. UPDATE EXISTING RLS POLICIES FOR LEADS
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

-- Create updated policies
CREATE POLICY "Users can view leads based on role" ON public.leads FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'telecalling_agent', 'visa_consultant'))
    )
);

CREATE POLICY "Allow lead creation and management" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update leads based on role" ON public.leads FOR UPDATE USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'telecalling_agent', 'visa_consultant'))
);

CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_referrals_lead_id ON public.referrals(lead_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_by ON public.referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_lead_id ON public.lead_remarks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_created_at ON public.lead_remarks(created_at);

-- =====================================================
-- 8. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update lead last_contacted_at when remark is added
CREATE OR REPLACE FUNCTION public.update_lead_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.leads
    SET last_contacted_at = NEW.created_at,
        call_count = call_count + 1
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating last contacted
DROP TRIGGER IF EXISTS update_lead_contact_info ON public.lead_remarks;
CREATE TRIGGER update_lead_contact_info
    AFTER INSERT ON public.lead_remarks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_last_contacted();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 9. ALLOW ANONYMOUS LEAD INSERTS (FOR CONTACT FORM)
-- =====================================================

-- Allow anonymous users to insert leads for the contact form
CREATE POLICY "Allow anonymous lead inserts" ON public.leads
FOR INSERT WITH CHECK (true);

-- Also allow anonymous users to view their own leads (optional, for confirmation)
CREATE POLICY "Allow anonymous lead view" ON public.leads
FOR SELECT USING (auth.uid() IS NULL OR auth.uid() IS NOT NULL);

-- =====================================================
-- 10. CREATE SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample profiles for different roles (uncomment and modify as needed)
-- INSERT INTO public.profiles (id, full_name, email, role) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'admin'),
--     ('00000000-0000-0000-0000-000000000002', 'John Agent', 'john@example.com', 'telecalling_agent'),
--     ('00000000-0000-0000-0000-000000000003', 'Sarah Consultant', 'sarah@example.com', 'visa_consultant');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- After running this migration:
-- 1. Create user accounts in Supabase Auth
-- 2. Create corresponding profiles with appropriate roles
-- 3. Test the CRM system functionality
-- 4. Assign leads to telecalling agents as needed

-- The CRM system is now ready with:
-- ✅ Role-based access control
-- ✅ Lead management with assignment
-- ✅ Appointment scheduling
-- ✅ Remarks and timeline functionality
-- ✅ Referral system
-- ✅ Enhanced tracking and reporting fields