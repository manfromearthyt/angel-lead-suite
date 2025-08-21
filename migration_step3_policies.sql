-- STEP 3: Create RLS Policies and Indexes
-- Run this AFTER step 2 has been executed and committed

-- RLS policies for referrals
DROP POLICY IF EXISTS "Users can view referrals they created or are assigned to" ON public.referrals;
CREATE POLICY "Users can view referrals they created or are assigned to" ON public.referrals FOR SELECT USING (
    referred_by = auth.uid() OR referred_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own referrals" ON public.referrals;
CREATE POLICY "Users can update their own referrals" ON public.referrals FOR UPDATE USING (
    referred_by = auth.uid() OR referred_to = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS policies for lead remarks
DROP POLICY IF EXISTS "Users can view all remarks for leads they have access to" ON public.lead_remarks;
CREATE POLICY "Users can view all remarks for leads they have access to" ON public.lead_remarks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.leads WHERE id = lead_id AND (
        assigned_agent_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'telecalling_agent', 'visa_consultant'))
    ))
);

DROP POLICY IF EXISTS "Users can create remarks" ON public.lead_remarks;
CREATE POLICY "Users can create remarks" ON public.lead_remarks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Update existing RLS policies for leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can update assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view leads based on role" ON public.leads;
DROP POLICY IF EXISTS "Allow lead creation and management" ON public.leads;
DROP POLICY IF EXISTS "Users can update leads based on role" ON public.leads;
DROP POLICY IF EXISTS "Admins can delete leads" ON public.leads;

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

-- Allow anonymous lead inserts for contact form
DROP POLICY IF EXISTS "Allow anonymous lead inserts" ON public.leads;
CREATE POLICY "Allow anonymous lead inserts" ON public.leads
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous lead view" ON public.leads;
CREATE POLICY "Allow anonymous lead view" ON public.leads
FOR SELECT USING (auth.uid() IS NULL OR auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
CREATE INDEX IF NOT EXISTS idx_referrals_lead_id ON public.referrals(lead_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_by ON public.referrals(referred_by);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_lead_id ON public.lead_remarks(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_remarks_created_at ON public.lead_remarks(created_at);