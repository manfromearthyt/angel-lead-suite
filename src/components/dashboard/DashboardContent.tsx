import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface DashboardContentProps {
   userProfile: any;
}

interface DashboardStats {
  totalLeads: number;
  totalAppointments: number;
  newLeads: number;
  pendingAppointments: number;
}

export function DashboardContent({ userProfile }: DashboardContentProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    totalAppointments: 0,
    newLeads: 0,
    pendingAppointments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, [userProfile]);

  const fetchDashboardStats = async () => {
    try {
      let leadsQuery = supabase.from('leads').select('*', { count: 'exact', head: true });
      let appointmentsQuery = supabase.from('appointments').select('*', { count: 'exact', head: true });

      // Filter based on user role
      if (userProfile?.role === 'telecalling_agent') {
        leadsQuery = leadsQuery.eq('assigned_agent_id', userProfile.id);
        appointmentsQuery = appointmentsQuery.eq('created_by', userProfile.id);
      } else if (userProfile?.role === 'visa_consultant') {
        appointmentsQuery = appointmentsQuery.eq('consultant_id', userProfile.id);
      }

      const [leadsResult, appointmentsResult] = await Promise.all([
        leadsQuery,
        appointmentsQuery
      ]);

      // Get new leads count (created in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const newLeadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (userProfile?.role === 'telecalling_agent') {
        newLeadsQuery.eq('assigned_agent_id', userProfile.id);
      }

      const newLeadsResult = await newLeadsQuery;

      // Get pending appointments
      const pendingAppointmentsQuery = supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      if (userProfile?.role === 'visa_consultant') {
        pendingAppointmentsQuery.eq('consultant_id', userProfile.id);
      }

      const pendingAppointmentsResult = await pendingAppointmentsQuery;

      setStats({
        totalLeads: leadsResult.count || 0,
        totalAppointments: appointmentsResult.count || 0,
        newLeads: newLeadsResult.count || 0,
        pendingAppointments: pendingAppointmentsResult.count || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">CRM Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your CRM dashboard, {userProfile?.full_name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newLeads > 0 ? `+${stats.newLeads} new this week` : 'No new leads this week'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingAppointments} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
            <p className="text-xs text-muted-foreground">Appointments to review</p>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {userProfile?.role === 'admin' && (
              <>
                <p className="text-sm">• Create and assign leads to agents</p>
                <p className="text-sm">• Monitor all system activities</p>
                <p className="text-sm">• Manage user accounts</p>
              </>
            )}
            {userProfile?.role === 'telecalling_agent' && (
              <>
                <p className="text-sm">• View and manage assigned leads</p>
                <p className="text-sm">• Add remarks and follow-ups</p>
                <p className="text-sm">• Schedule appointments</p>
              </>
            )}
            {userProfile?.role === 'visa_consultant' && (
              <>
                <p className="text-sm">• View scheduled appointments</p>
                <p className="text-sm">• Update appointment status</p>
                <p className="text-sm">• Review lead information</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Current system information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Database: Connected</p>
            <p className="text-sm">• Role: {userProfile?.role?.replace('_', ' ')}</p>
            <p className="text-sm">• Status: Active</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}