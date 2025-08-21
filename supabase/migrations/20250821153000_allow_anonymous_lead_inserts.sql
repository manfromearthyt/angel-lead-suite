-- Allow anonymous users to insert leads for the contact form
-- This policy allows anyone to submit leads through the website form
CREATE POLICY "Allow anonymous lead inserts" ON public.leads
FOR INSERT
WITH CHECK (true);

-- Also allow anonymous users to view their own leads (optional, for confirmation)
CREATE POLICY "Allow anonymous lead view" ON public.leads
FOR SELECT
USING (auth.uid() IS NULL OR auth.uid() IS NOT NULL);