import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country_of_interest: string | null;
  visa_type: string | null;
  message: string | null;
  status: string;
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
  role: string;
}

export default function LeadsPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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

  useEffect(() => {
    fetchLeads();
    fetchAgents();
  }, [user]);

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
      if (userProfile?.role === 'telecalling_agent') {
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
        .in('role', ['telecalling_agent', 'admin']);

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('leads')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Lead created successfully"
      });

      setShowCreateDialog(false);
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
      fetchLeads();
    } catch (error) {
      console.error('Error creating lead:', error);
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive"
      });
    }
  };

  const handleAssignLead = async (leadId: string, agentId: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ assigned_agent_id: agentId, status: 'assigned' })
        .eq('id', leadId);

      if (error) throw error;

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
        .from('lead_remarks')
        .insert([{
          lead_id: selectedLead.id,
          user_id: user?.id,
          remark_text: newRemark,
          remark_type: 'general'
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Leads Management</h2>
          <p className="text-muted-foreground">
            Manage and track all leads in your system
          </p>
        </div>
        {userProfile?.role === 'admin' && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLead} className="space-y-4">
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
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Lead</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
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
                  Add Remark
                </Button>

                {userProfile?.role === 'admin' && !lead.assigned_agent_id && (
                  <Select onValueChange={(agentId) => handleAssignLead(lead.id, agentId)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign to agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Remarks Dialog */}
      <Dialog open={showRemarksDialog} onOpenChange={setShowRemarksDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Remark for {selectedLead?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRemark} className="space-y-4">
            <div>
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                placeholder="Enter your remark..."
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowRemarksDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Remark</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}