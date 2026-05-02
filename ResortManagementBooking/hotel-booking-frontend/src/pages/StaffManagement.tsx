import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
import { Label } from "../components/ui/label";
import { toast } from "../hooks/use-toast";
import * as apiClient from "../api-client";
import { Plus, Pencil, Trash2, Power, PowerOff, Search, Users } from "lucide-react";
import FrontDeskDialog from "../components/FrontDeskDialog";

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  assignedResorts: Array<{
    resortId: string;
    resortName: string;
    role: string;
  }>;
  permissions?: any;
}

const StaffManagement = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [staffCredentials, setStaffCredentials] = useState<{ email: string; password: string } | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await apiClient.fetchResortStaff();
      setStaff(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      });
      setStaff([]); // Ensure staff is always an array on error
    } finally {
      setLoading(false);
    }
  };

  const handleStaffCreated = (credentials: { email: string; password: string }) => {
    setStaffCredentials(credentials);
    loadStaff();
  };

  const handleDialogClose = (success: boolean) => {
    setIsDialogOpen(false);
    setEditingStaff(null);
    if (success) {
      loadStaff();
    }
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingStaff(null);
    setIsDialogOpen(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await apiClient.deleteResortStaff(staffId);
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
      loadStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (staffId: string) => {
    try {
      await apiClient.toggleResortStaffStatus(staffId);
      toast({
        title: "Success",
        description: "Staff status updated successfully",
      });
      loadStaff();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const filteredStaff = (staff || []).filter((member) => {
    const matchesSearch =
      `${member.firstName} ${member.lastName} ${member.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Staff Management</CardTitle>
          <CardDescription>
            Manage resort staff members, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Staff Credentials Display */}
          {staffCredentials && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Staff Account Created!</h4>
              <p className="text-sm text-green-700">
                Email: <span className="font-mono">{staffCredentials.email}</span>
              </p>
              <p className="text-sm text-green-700">
                Password: <span className="font-mono">{staffCredentials.password}</span>
              </p>
              <p className="text-xs text-green-600 mt-2">
                Please save these credentials securely. The staff member will need to change their password on first login.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStaffCredentials(null)}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading staff members...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned Resorts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell className="font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.role.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.assignedResorts.map((resort, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {resort.resortName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? "default" : "secondary"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(member._id)}
                          >
                            {member.isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteStaff(member._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Front Desk Dialog */}
      <FrontDeskDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onStaffCreated={handleStaffCreated}
        editingStaff={editingStaff}
      />
    </div>
  );
};

export default StaffManagement;

