import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { supabase } from "@/integrations/supabase/client";
import LeadsPage from "./LeadsPage";
import AppointmentsPage from "./AppointmentsPage";
import SettingsPage from "./SettingsPage";


export default function Dashboard() {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar userProfile={userProfile} />
        <div className="flex-1 flex flex-col">
          <DashboardHeader userProfile={userProfile} />
          <main className="flex-1 p-6">
            <Routes>
              <Route index element={<DashboardContent userProfile={userProfile} />} />
              <Route path="leads" element={<LeadsPage userProfile={userProfile} />} />
              <Route path="appointments" element={<AppointmentsPage userProfile={userProfile} />} />
              <Route path="settings" element={<SettingsPage userProfile={userProfile} />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}