import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Clock, User, Plus } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  lead_id: string;
  consultant_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  status: string;
  created_at: string;
  leads?: {
    full_name: string;
    email: string;
  };
  consultant?: {
    full_name: string;
  };
  created_by_profile?: {
    full_name: string;
  };
}

interface Lead {
  id: string;
  full_name: string;
  email: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

export default function AppointmentsPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [consultants, setConsultants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Form state for creating appointments
  const [formData, setFormData] = useState({
    lead_id: "",
    consultant_id: "",
    scheduled_at: "",
    duration_minutes: 60,
    notes: ""
  });

  useEffect(() => {
    fetchAppointments();
    fetchLeads();
    fetchConsultants();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          leads:lead_id (
            full_name,
            email
          ),
          consultant:consultant_id (
            full_name
          ),
          created_by_profile:created_by (
            full_name
          )
        `)
        .order('scheduled_at', { ascending: true });

      // Filter based on user role
      if (userProfile?.role === 'visa_consultant') {
        query = query.eq('consultant_id', user?.id);
      } else if (userProfile?.role === 'telecalling_agent') {
        // Agents can see appointments for their assigned leads
        const { data: agentLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('assigned_agent_id', user?.id);

        if (agentLeads && agentLeads.length > 0) {
          const leadIds = agentLeads.map(lead => lead.id);
          query = query.in('lead_id', leadIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchConsultants = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'visa_consultant');

      if (error) throw error;
      setConsultants(data || []);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!selectedDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }
  
    try {
      // Check if lead is assigned to an agent
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('assigned_agent_id, status')
        .eq('id', formData.lead_id)
        .single();
  
      if (leadError) throw leadError;
  
      // If lead is not assigned, assign it to the current user if they're an agent
      if (!leadData.assigned_agent_id && userProfile?.role === 'telecalling_agent') {
        await supabase
          .from('leads')
          .update({ 
            assigned_agent_id: user?.id,
            status: 'in_progress'
          })
          .eq('id', formData.lead_id);
      }
  
      // Combine date and time
      const scheduledDateTime = new Date(selectedDate);
      const [hours, minutes] = formData.scheduled_at.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));
  
      // Create the appointment
      const { error } = await supabase
        .from('appointments')
        .insert([{
          ...formData,
          scheduled_at: scheduledDateTime.toISOString(),
          created_by: user?.id,
          status: 'scheduled'
        }]);
  
      if (error) throw error;
  
      // Add a remark about the appointment
      await supabase
        .from('lead_remarks')
        .insert([{
          lead_id: formData.lead_id,
          user_id: user?.id,
          remark_text: `Appointment scheduled for ${scheduledDateTime.toLocaleString()}`,
          remark_type: 'appointment_update'
        }]);
  
      toast({
        title: "Success",
        description: "Appointment scheduled successfully"
      });
  
      setShowCreateDialog(false);
      setFormData({
        lead_id: "",
        consultant_id: "",
        scheduled_at: "",
        duration_minutes: 60,
        notes: ""
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule appointment",
        variant: "destructive"
      });
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment ${status} successfully`
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Appointments</h2>
          <p className="text-muted-foreground">
            Schedule and manage appointments with visa consultants
          </p>
        </div>
        {(userProfile?.role === 'admin' || userProfile?.role === 'telecalling_agent') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lead">Select Lead *</Label>
                    <Select value={formData.lead_id} onValueChange={(value) => setFormData(prev => ({ ...prev, lead_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.full_name} - {lead.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="consultant">Visa Consultant *</Label>
                    <Select value={formData.consultant_id} onValueChange={(value) => setFormData(prev => ({ ...prev, consultant_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose consultant" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultants.map((consultant) => (
                          <SelectItem key={consultant.id} value={consultant.id}>
                            {consultant.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Appointment Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="time">Time *</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.scheduled_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select value={formData.duration_minutes.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes for the appointment..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Schedule Appointment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Appointment with {appointment.leads?.full_name}
                  </CardTitle>
                  <CardDescription>
                    {appointment.leads?.email}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consultant</p>
                  <p>{appointment.consultant?.full_name || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(appointment.scheduled_at), 'PPP p')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p>{appointment.duration_minutes} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p>{appointment.created_by_profile?.full_name}</p>
                </div>
              </div>

              {appointment.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              )}

              <div className="flex gap-2">
                {userProfile?.role === 'visa_consultant' && appointment.status === 'scheduled' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {appointment.status === 'scheduled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateAppointmentStatus(appointment.id, 'rescheduled')}
                  >
                    Reschedule
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No appointments scheduled yet.</p>
          {(userProfile?.role === 'admin' || userProfile?.role === 'telecalling_agent') && (
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              Schedule First Appointment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}