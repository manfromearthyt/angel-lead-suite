-- Test Users Setup for CRM System
-- Run this after creating users in Supabase Auth

-- =====================================================
-- INSTRUCTIONS:
-- =====================================================
-- 1. First, create users in Supabase Auth Dashboard:
--    Go to Authentication > Users
--    Click "Add user" and create the following accounts:
--
--    ADMINS (2):
--    - admin1@example.com / password123
--    - admin2@example.com / password123
--
--    TELECAllING AGENTS (3):
--    - agent1@example.com / password123
--    - agent2@example.com / password123
--    - agent3@example.com / password123
--
--    VISA CONSULTANTS (5):
--    - consultant1@example.com / password123
--    - consultant2@example.com / password123
--    - consultant3@example.com / password123
--    - consultant4@example.com / password123
--    - consultant5@example.com / password123
--
-- 2. After creating users, copy their UUIDs from the Auth dashboard
-- 3. Replace the UUIDs below with the actual UUIDs from your users
-- 4. Run this SQL script

-- =====================================================
-- TEST USER PROFILES
-- =====================================================

-- Note: Replace these UUIDs with actual user IDs from your Supabase Auth

-- Admins
INSERT INTO public.profiles (id, full_name, email, role) VALUES
('0722dad8-dce0-421b-b571-8f4f406cab7f', 'Admin One', 'admin1@example.com', 'admin'),
('c81e0b94-a1e0-48cd-9b70-3e31f79fc3ff', 'Admin Two', 'admin2@example.com', 'admin')

ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Telecalling Agents
INSERT INTO public.profiles (id, full_name, email, role) VALUES
('dd91f659-310f-4cba-804e-2359efcb88ef', 'John Agent', 'agent1@example.com', 'telecalling_agent'),
('2019d844-809b-425a-97a7-17a9fa412064', 'Sarah Agent', 'agent2@example.com', 'telecalling_agent'),
('495a013e-2ad3-4eba-9913-442a3566b49f', 'Mike Agent', 'agent3@example.com', 'telecalling_agent')

ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- Visa Consultants
INSERT INTO public.profiles (id, full_name, email, role) VALUES
('e7323452-e180-4789-8acc-5a44b27fa375', 'Dr. Emily Consultant', 'consultant1@example.com', 'visa_consultant'),
('abefd43b-984f-47cf-a683-1c5078ea32b6', 'Dr. David Consultant', 'consultant2@example.com', 'visa_consultant'),
('345d7c57-895f-4971-9305-1e2c1bbd380d', 'Dr. Lisa Consultant', 'consultant3@example.com', 'visa_consultant'),
('768a7172-77ff-480b-8fb7-a9fffe24f63f', 'Dr. Robert Consultant', 'consultant4@example.com', 'visa_consultant'),
('62944e16-13eb-43a8-bd5c-a0a359cc7e45', 'Dr. Maria Consultant', 'consultant5@example.com', 'visa_consultant')

ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role;

-- =====================================================
-- SAMPLE LEADS FOR TESTING
-- =====================================================

INSERT INTO public.leads (full_name, email, phone, country_of_interest, visa_type, message, priority, assigned_agent_id) VALUES
('John Smith', 'john.smith@email.com', '+1-555-0101', 'Canada', 'work', 'Looking for work visa options', 'high', 'dd91f659-310f-4cba-804e-2359efcb88ef'),
('Maria Garcia', 'maria.garcia@email.com', '+1-555-0102', 'Australia', 'student', 'Student visa inquiry', 'medium', '2019d844-809b-425a-97a7-17a9fa412064'),
('Ahmed Hassan', 'ahmed.hassan@email.com', '+1-555-0103', 'UK', 'business', 'Business visa consultation needed', 'urgent', '495a013e-2ad3-4eba-9913-442a3566b49f'),
('Priya Patel', 'priya.patel@email.com', '+1-555-0104', 'USA', 'work', 'Work visa for IT professional', 'high', 'dd91f659-310f-4cba-804e-2359efcb88ef'),
('Carlos Rodriguez', 'carlos.rodriguez@email.com', '+1-555-0105', 'Germany', 'student', 'Master''s program application', 'medium', '2019d844-809b-425a-97a7-17a9fa412064')

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SAMPLE APPOINTMENTS FOR TESTING
-- =====================================================

INSERT INTO public.appointments (lead_id, consultant_id, scheduled_at, duration_minutes, notes, created_by) VALUES
((SELECT id FROM public.leads WHERE email = 'john.smith@email.com' LIMIT 1), 'e7323452-e180-4789-8acc-5a44b27fa375', NOW() + INTERVAL '1 day', 60, 'Initial consultation for work visa', '0722dad8-dce0-421b-b571-8f4f406cab7f'),
((SELECT id FROM public.leads WHERE email = 'maria.garcia@email.com' LIMIT 1), 'abefd43b-984f-47cf-a683-1c5078ea32b6', NOW() + INTERVAL '2 days', 45, 'Student visa guidance', 'c81e0b94-a1e0-48cd-9b70-3e31f79fc3ff'),
((SELECT id FROM public.leads WHERE email = 'ahmed.hassan@email.com' LIMIT 1), '345d7c57-895f-4971-9305-1e2c1bbd380d', NOW() + INTERVAL '3 days', 90, 'Business visa strategy session', '0722dad8-dce0-421b-b571-8f4f406cab7f')

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- =====================================================

-- After running this script:
-- 1. Test logging in with different user roles
-- 2. Try assigning leads to agents (as admin)
-- 3. Test creating appointments (as agents)
-- 4. Test adding remarks to leads
-- 5. Verify role-based access control

-- Test Credentials:
-- Admin: admin1@example.com / password123
-- Agent: agent1@example.com / password123
-- Consultant: consultant1@example.com / password123