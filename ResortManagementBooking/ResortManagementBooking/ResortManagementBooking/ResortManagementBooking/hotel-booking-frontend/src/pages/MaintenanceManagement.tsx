import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { toast } from "../hooks/use-toast";
import { fetchMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest, deleteMaintenanceRequest, assignMaintenanceRequest } from "../api-client";
import { Plus, Pencil, Trash2, AlertCircle, CheckCircle, Clock, Search, Wrench } from "lucide-react";

interface MaintenanceRequest {
  _id: string;
  hotelId?: string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "hvac" | "structural" | "furniture" | "equipment" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  location?: string;
  assignedTo?: string;
  assignedToName?: string;
  estimatedCost?: number;
  actualCost?: number;
  dueDate?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const MaintenanceManagement = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [assigningRequest, setAssigningRequest] = useState<MaintenanceRequest | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "other" as any,
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    location: "",
    estimatedCost: "",
    dueDate: "",
  });
  const [assignStaffId, setAssignStaffId] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchMaintenanceRequests();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load maintenance requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequest = async () => {
    try {
      await createMaintenanceRequest({
        ...formData,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });
      toast({
        title: "Success",
        description: "Maintenance request created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      loadRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create maintenance request",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRequest = async () => {
    if (!editingRequest) return;
    try {
      await updateMaintenanceRequest(editingRequest._id, {
        ...formData,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      });
      toast({
        title: "Success",
        description: "Maintenance request updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingRequest(null);
      resetForm();
      loadRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update maintenance request",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this maintenance request?")) return;
    try {
      await deleteMaintenanceRequest(requestId);
      toast({
        title: "Success",
        description: "Maintenance request deleted successfully",
      });
      loadRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete maintenance request",
        variant: "destructive",
      });
    }
  };

  const handleCompleteRequest = async (request: MaintenanceRequest) => {
    try {
      await updateMaintenanceRequest(request._id, { status: "completed" });
      toast({
        title: "Success",
        description: "Maintenance request marked as completed",
      });
      loadRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete maintenance request",
        variant: "destructive",
      });
    }
  };

  const handleAssignRequest = async () => {
    if (!assigningRequest) return;
    try {
      await assignMaintenanceRequest(assigningRequest._id, assignStaffId);
      toast({
        title: "Success",
        description: "Maintenance request assigned successfully",
      });
      setIsAssignDialogOpen(false);
      setAssigningRequest(null);
      setAssignStaffId("");
      loadRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign maintenance request",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description,
      category: request.category,
      priority: request.priority,
      location: request.location || "",
      estimatedCost: request.estimatedCost?.toString() || "",
      dueDate: request.dueDate ? request.dueDate.split('T')[0] : "",
    });
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (request: MaintenanceRequest) => {
    setAssigningRequest(request);
    setAssignStaffId(request.assignedTo || "");
    setIsAssignDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "other",
      priority: "medium",
      location: "",
      estimatedCost: "",
      dueDate: "",
    });
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.location && request.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || request.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ["plumbing", "electrical", "hvac", "structural", "furniture", "equipment", "other"];
  const priorities = ["low", "medium", "high", "urgent"];
  const statuses = ["pending", "in_progress", "completed", "cancelled"];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "cancelled": return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Maintenance Management
          </CardTitle>
          <CardDescription>
            Manage maintenance requests, assignments, and completion tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Maintenance Request</DialogTitle>
                    <DialogDescription>
                      Create a new maintenance request
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority *</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Room 101, Lobby, Pool Area"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedCost">Estimated Cost (₱)</Label>
                      <Input
                        id="estimatedCost"
                        type="number"
                        step="0.01"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddRequest}>Create Request</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading maintenance requests...</div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No maintenance requests found
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <Card key={request._id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{request.title}</h3>
                            <Badge variant={getPriorityColor(request.priority)}>
                              {request.priority.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {request.category.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm">
                            {request.location && (
                              <span className="flex items-center gap-1">
                                <strong>Location:</strong> {request.location}
                              </span>
                            )}
                            {request.estimatedCost && (
                              <span className="flex items-center gap-1">
                                <strong>Est. Cost:</strong> ₱{request.estimatedCost.toFixed(2)}
                              </span>
                            )}
                            {request.dueDate && (
                              <span className="flex items-center gap-1">
                                <strong>Due:</strong> {new Date(request.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            {getStatusIcon(request.status)}
                            <Badge variant="outline">
                              {request.status.replace(/_/g, " ").toUpperCase()}
                            </Badge>
                            {request.assignedToName && (
                              <span className="text-sm text-muted-foreground">
                                Assigned to: {request.assignedToName}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(request)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAssignDialog(request)}
                          >
                            Assign
                          </Button>
                          {request.status !== "completed" && request.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCompleteRequest(request)}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRequest(request._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Request</DialogTitle>
            <DialogDescription>
              Update maintenance request details
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-estimatedCost">Estimated Cost (₱)</Label>
              <Input
                id="edit-estimatedCost"
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
              <Input
                id="edit-dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRequest}>Update Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Maintenance Request</DialogTitle>
            <DialogDescription>
              Assign this maintenance request to a staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="staffId">Staff Member ID *</Label>
              <Input
                id="staffId"
                value={assignStaffId}
                onChange={(e) => setAssignStaffId(e.target.value)}
                placeholder="Enter staff member ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRequest}>Assign Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenanceManagement;

