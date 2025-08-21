-- Enhanced CRM Features Migration
-- Adds support for telecalling agents, lead assignments, referrals, and remarks timeline

-- Add new user roles for telecalling agents and visa consultants
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'telecalling_agent';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'visa_consultant';

-- Add new lead status for better tracking
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'follow_up_required';

-- Create referrals table
CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    referred_by UUID NOT NULL REFERENCES public.profiles(id),
    referred_to UUID REFERENCES public.profiles(id),
    referral_reason TEXT,
    status referral_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral status enum
CREATE TYPE public.referral_status AS ENUM ('pending', 'accepted', 'declined', 'completed');

-- Create lead_remarks table for timeline functionality
CREATE TABLE public.lead_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    remark_text TEXT NOT NULL,
    remark_type remark_type DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create remark type enum
CREATE TYPE public.remark_type AS ENUM ('general', 'call_log', 'appointment_update', 'status_change', 'assignment_change');

-- Add additional fields to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS priority lead_priority DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;

-- Create lead priority enum
CREATE TYPE public.lead_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Enable RLS on new tables
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_remarks ENABLE ROW LEVEL SECURITY;

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

-- Create indexes for better performance
CREATE INDEX idx_leads_assigned_agent ON public.leads(assigned_agent_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_priority ON public.leads(priority);
CREATE INDEX idx_referrals_lead_id ON public.referrals(lead_id);
CREATE INDEX idx_referrals_referred_by ON public.referrals(referred_by);
CREATE INDEX idx_lead_remarks_lead_id ON public.lead_remarks(lead_id);
CREATE INDEX idx_lead_remarks_created_at ON public.lead_remarks(created_at);

-- Create function to update lead last_contacted_at when remark is added
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

-- Create trigger for updating last contacted
CREATE TRIGGER update_lead_contact_info
    AFTER INSERT ON public.lead_remarks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_lead_last_contacted();

-- Update existing RLS policies to include new roles
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
CREATE POLICY "Users can view leads based on role" ON public.leads FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
        assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'telecalling_agent', 'visa_consultant'))
    )
);

DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
CREATE POLICY "Allow lead creation and management" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Agents can update assigned leads" ON public.leads;
CREATE POLICY "Users can update leads based on role" ON public.leads FOR UPDATE USING (
    assigned_agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'telecalling_agent', 'visa_consultant'))
);

DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);