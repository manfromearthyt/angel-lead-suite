-- STEP 4: Create Functions and Triggers
-- Run this AFTER step 3 has been executed and committed

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
-- MIGRATION COMPLETE
-- =====================================================

-- After running all migration steps:
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