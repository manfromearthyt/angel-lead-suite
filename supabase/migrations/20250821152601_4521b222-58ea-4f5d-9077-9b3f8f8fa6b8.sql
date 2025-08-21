-- Create enum types for user roles and lead statuses
CREATE TYPE public.user_role AS ENUM ('admin', 'agent', 'consultant');
CREATE TYPE public.lead_status AS ENUM ('new', 'contacted', 'interested', 'qualified', 'appointment_scheduled', 'consultation_completed', 'converted', 'rejected');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');

-- Create profiles table for user management
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'agent',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country_of_interest TEXT,
    visa_type TEXT,
    message TEXT,
    status lead_status DEFAULT 'new',
    assigned_agent_id UUID REFERENCES public.profiles(id),
    source TEXT DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lead timeline table for progress tracking
CREATE TABLE public.lead_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    status lead_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES public.profiles(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    notes TEXT,
    status appointment_status DEFAULT 'scheduled',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for leads
CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Agents can update assigned leads" ON public.leads FOR UPDATE USING (
    assigned_agent_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create RLS policies for lead timeline
CREATE POLICY "Users can view lead timeline" ON public.lead_timeline FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert timeline entries" ON public.lead_timeline FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create RLS policies for appointments
CREATE POLICY "Users can view appointments" ON public.appointments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update appointments" ON public.appointments FOR UPDATE USING (
    consultant_id = auth.uid() OR created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
        new.email,
        'agent'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically add timeline entry when lead status changes
CREATE OR REPLACE FUNCTION public.handle_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only add timeline entry if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.lead_timeline (lead_id, user_id, status, notes)
        VALUES (NEW.id, auth.uid(), NEW.status, 'Status updated to ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lead status changes
CREATE TRIGGER on_lead_status_change
    AFTER UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION public.handle_lead_status_change();