import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Clock, Edit, Plus } from "lucide-react";
import { format } from "date-fns";

interface Remark {
  id: string;
  lead_id: string;
  user_id: string;
  remark_text: string;
  remark_type: string;
  created_at: string;
  user_profile?: {
    full_name: string;
  };
}

interface RemarksTimelineProps {
  leadId: string;
  leadName: string;
}

export function RemarksTimeline({ leadId, leadName }: RemarksTimelineProps) {
  const { user, userProfile } = useAuth();
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRemark, setNewRemark] = useState({
    text: "",
    type: "general"
  });

  useEffect(() => {
    fetchRemarks();
  }, [leadId]);

  const fetchRemarks = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_remarks')
        .select(`
          *,
          user_profile:profiles (
            full_name
          )
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRemarks(data || []);
    } catch (error) {
      console.error('Error fetching remarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.text.trim()) return;

    try {
      const { error } = await supabase
        .from('lead_remarks')
        .insert([{
          lead_id: leadId,
          user_id: user?.id,
          remark_text: newRemark.text,
          remark_type: newRemark.type
        }]);

      if (error) throw error;

      setNewRemark({ text: "", type: "general" });
      setShowAddDialog(false);
      fetchRemarks();
    } catch (error) {
      console.error('Error adding remark:', error);
    }
  };

  const getRemarkTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-blue-100 text-blue-800';
      case 'call_log': return 'bg-green-100 text-green-800';
      case 'appointment_update': return 'bg-purple-100 text-purple-800';
      case 'status_change': return 'bg-yellow-100 text-yellow-800';
      case 'assignment_change': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRemarkTypeLabel = (type: string) => {
    switch (type) {
      case 'general': return 'General';
      case 'call_log': return 'Call Log';
      case 'appointment_update': return 'Appointment Update';
      case 'status_change': return 'Status Change';
      case 'assignment_change': return 'Assignment Change';
      default: return 'General';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Activity Timeline - {leadName}</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Remark
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Remark for {leadName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRemark} className="space-y-4">
              <div>
                <Label htmlFor="remark_type">Remark Type</Label>
                <Select value={newRemark.type} onValueChange={(value) => setNewRemark(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="call_log">Call Log</SelectItem>
                    <SelectItem value="appointment_update">Appointment Update</SelectItem>
                    <SelectItem value="status_change">Status Change</SelectItem>
                    <SelectItem value="assignment_change">Assignment Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="remark_text">Remark</Label>
                <Textarea
                  id="remark_text"
                  value={newRemark.text}
                  onChange={(e) => setNewRemark(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Enter your remark..."
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Remark</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {remarks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-24">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p>No remarks yet</p>
                <p className="text-sm">Add the first remark to start the timeline</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          remarks.map((remark) => (
            <Card key={remark.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {remark.user_profile?.full_name || 'Unknown User'}
                    </span>
                    <Badge className={getRemarkTypeColor(remark.remark_type)}>
                      {getRemarkTypeLabel(remark.remark_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(remark.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {remark.remark_text}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}