import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, User, Calendar, MessageSquare, Phone } from "lucide-react";
import { DialogDescription, DialogFooter } from "@/components/ui/dialog";



import { RemarksTimeline } from "@/components/RemarksTimeline";
interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country_of_interest: string | null;
  visa_type: string | null;
  message: string | null;
  status: Database["public"]["Enums"]["lead_status"];
  priority: string;
  assigned_agent_id: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  role: Database["public"]["Enums"]["user_role"];
}

export default function LeadsPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadFormDialog, setShowLeadFormDialog] = useState(false); // Unified dialog for create/edit
  const [showRemarksDialog, setShowRemarksDialog] = useState(false);
  const [showTimelineDialog, setShowTimelineDialog] = useState(false);
  const [newRemark, setNewRemark] = useState("");
  const [leadRemarks, setLeadRemarks] = useState<any[]>([]);

  // Form state for creating/editing leads
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    country_of_interest: "",
    visa_type: "",
    message: "",
    priority: "medium",
    assigned_agent_id: ""
  });
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, [user]);

  // Reset form data when the dialog is closed or opened for a new lead
  useEffect(() => {
    if (!showLeadFormDialog) {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        country_of_interest: "",
        visa_type: "",
        message: "",
        priority: "medium",
        assigned_agent_id: ""
      });
      setSelectedLead(null); // Clear selected lead when dialog closes
    } else if (selectedLead) {
      // If editing, populate form with selected lead data
      setFormData({
        full_name: selectedLead.full_name,
        email: selectedLead.email,
        phone: selectedLead.phone || "",
        country_of_interest: selectedLead.country_of_interest || "",
        visa_type: selectedLead.visa_type || "",
        message: selectedLead.message || "",
        priority: selectedLead.priority,
        assigned_agent_id: selectedLead.assigned_agent_id || ""
      });
    }
  }, [showLeadFormDialog, selectedLead]);

  const fetchLeads = async () => {
    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          profiles:assigned_agent_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // Filter leads based on user role
      if (userProfile?.role === 'agent') {
        query = query.eq('assigned_agent_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['agent', 'admin']);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleCreateOrUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.full_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const leadData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        country_of_interest: formData.country_of_interest.trim() || null,
        visa_type: formData.visa_type.trim() || null,
        message: formData.message.trim() || null,
        priority: formData.priority,
        assigned_agent_id: formData.assigned_agent_id || null,
        status: 'new' // Default status for new leads
      };

      if (selectedLead) {
        // Update existing lead
        await handleUpdateLead(selectedLead.id, leadData);
      } else {
        // Create new lead
        const { data, error } = await supabase
          .from('leads')
          .insert([{ ...leadData, source: 'admin_dashboard' }])
          .select();

        if (error) throw error;

        // Add a remark about lead creation
        if (data && data[0]?.id) {
          await supabase
            .from('lead_remarks')
            .insert([{
              lead_id: data[0].id,
              user_id: user?.id,
              remark_text: 'Lead created through admin dashboard',
              remark_type: 'status_change'
            }]);
        }

        toast({
          title: "Success",
          description: "Lead created successfully"
        });
      }

      // Reset form and close dialog
      setShowLeadFormDialog(false);
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        country_of_interest: "",
        visa_type: "",
        message: "",
        priority: "medium",
        assigned_agent_id: ""
      });
      setSelectedLead(null);
      
      // Refresh the leads list
      fetchLeads();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save lead",
        variant: "destructive"
      });
    }
  };

  const handleAssignLead = async (leadId: string, agentId: string) => {
    try {
      // Update the lead
      const { error } = await supabase
        .from('leads')
        .update({ assigned_agent_id: agentId, status: 'in_progress' })
        .eq('id', leadId);
  
      if (error) throw error;
  
      // Add a remark about the assignment
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        await supabase
          .from('lead_timeline')
          .insert([{
            lead_id: leadId,
            user_id: user?.id,
            notes: `Lead assigned to ${agent.full_name}`,
            status: 'assigned' // Using 'assigned' as status for assignment remark
          }]);
      }
  
      toast({
        title: "Success",
        description: "Lead assigned successfully"
      });
      fetchLeads();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "Error",
        description: "Failed to assign lead",
        variant: "destructive"
      });
    }
  };

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newRemark.trim()) return;

    try {
      const { error } = await supabase
        .from('lead_timeline')
        .insert([{
          lead_id: selectedLead.id,
          user_id: user?.id,
          notes: newRemark,
          status: 'in_progress' // Using 'in_progress' as a generic status for remarks
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Remark added successfully"
      });

      setNewRemark("");
      setShowRemarksDialog(false);
    } catch (error) {
      console.error('Error adding remark:', error);
      toast({
        title: "Error",
        description: "Failed to add remark",
        variant: "destructive"
      });
    }
  };

// Add this function to handle updating a lead
const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
  try {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId);

    if (error) throw error;

    // Add a remark about the update
    await supabase
      .from('lead_timeline')
      .insert([{
        lead_id: leadId,
        user_id: user?.id,
        notes: 'Lead details updated',
        status: 'in_progress' // Using 'in_progress' as a generic status for updates
      }]);

    toast({
      title: "Success",
      description: "Lead updated successfully"
    });
    
    // Refresh the leads list
    fetchLeads();
    return true;
  } catch (error) {
    console.error('Error updating lead:', error);
    toast({
      title: "Error",
      description: "Failed to update lead",
      variant: "destructive"
    });
    return false;
  }
};

// Add this function to handle deleting a lead (admin only)
const handleDeleteLead = async (leadId: string) => {
  if (userProfile?.role !== 'admin') {
    toast({
      title: "Access Denied",
      description: "Only administrators can delete leads",
      variant: "destructive"
    });
    return false;
  }

  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;

    toast({
      title: "Success",
      description: "Lead deleted successfully"
    });
    
    // Refresh the leads list
    fetchLeads();
    return true;
  } catch (error) {
    console.error('Error deleting lead:', error);
    toast({
      title: "Error",
      description: "Failed to delete lead",
      variant: "destructive"
    });
    return false;
  }
};

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'contacted': return 'bg-green-100 text-green-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
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

  // Debug log to check user role
  console.log('Current user role:', userProfile?.role);
  console.log('User has permission to add leads:', userProfile?.role === 'admin' || userProfile?.role === 'agent');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Leads Management</h2>
          <p className="text-muted-foreground">
            Manage and track all leads in your system
          </p>
        </div>
        {/* Always show the button for now for testing */}
        <Dialog open={showLeadFormDialog} onOpenChange={setShowLeadFormDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedLead(null)}> {/* Clear selected lead when opening for new */}
                <Plus className="h-4 w-4 mr-2" />
                Add New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedLead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdateLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="country">Country of Interest</Label>
                    <Input
                      id="country"
                      value={formData.country_of_interest}
                      onChange={(e) => setFormData(prev => ({ ...prev, country_of_interest: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="visa_type">Visa Type</Label>
                    <Input
                      id="visa_type"
                      value={formData.visa_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, visa_type: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Additional information..."
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_agent">Assign to Agent</Label>
                  <Select value={formData.assigned_agent_id} onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_agent_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name} ({agent.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowLeadFormDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{selectedLead ? "Update Lead" : "Create Lead"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <div className="grid gap-4">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {lead.full_name}
                  </CardTitle>
                  <CardDescription>{lead.email}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(lead.priority)}>
                    {lead.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{lead.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Country</p>
                  <p>{lead.country_of_interest || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Visa Type</p>
                  <p>{lead.visa_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned Agent</p>
                  <p>{lead.profiles?.full_name || 'Unassigned'}</p>
                </div>
              </div>

              {lead.message && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground">Message</p>
                  <p className="text-sm">{lead.message}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedLead(lead);
                    setShowRemarksDialog(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                
                {/* Edit Button - Visible to all users */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Set the form data with the current lead's data
                    setFormData({
                      full_name: lead.full_name || "",
                      email: lead.email || "",
                      phone: lead.phone || "",
                      country_of_interest: lead.country_of_interest || "",
                      visa_type: lead.visa_type || "",
                      message: lead.message || "",
                      priority: lead.priority || "medium",
                      assigned_agent_id: lead.assigned_agent_id || ""
                    });
                    setSelectedLead(lead);
                    setShowLeadFormDialog(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                {/* Delete Button - Only visible to admins */}
                {userProfile?.role === 'admin' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
                        await handleDeleteLead(lead.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remarks Dialog */}
     {/* Lead Details Dialog with Remarks Timeline */}
<Dialog open={showRemarksDialog} onOpenChange={setShowRemarksDialog}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Lead Details</DialogTitle>
      <DialogDescription>
        {selectedLead?.full_name} - {selectedLead?.email}
      </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Lead Information */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Phone</p>
          <p>{selectedLead?.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Country of Interest</p>
          <p>{selectedLead?.country_of_interest || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Visa Type</p>
          <p>{selectedLead?.visa_type || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Status</p>
          <Badge className={getStatusColor(selectedLead?.status || '')}>
            {selectedLead?.status || 'N/A'}
          </Badge>
        </div>
      </div>

      {selectedLead?.message && (
        <div>
          <p className="text-sm font-medium text-muted-foreground">Message</p>
          <p className="text-sm mt-1">{selectedLead.message}</p>
        </div>
      )}

      {/* Remarks Timeline */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-4">Timeline & Remarks</h3>
        <div className="mt-4">
          <RemarksTimeline 
            leadId={selectedLead?.id || ''} 
            leadName={selectedLead?.full_name || 'Lead'} 
          />
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowRemarksDialog(false)}>
        Close
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  );
}