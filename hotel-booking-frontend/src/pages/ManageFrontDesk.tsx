import { useEffect, useState } from "react";
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { Users, Plus, Edit, Trash2, Key, Copy, RefreshCw } from "lucide-react";
import FrontDeskDialog from "../components/FrontDeskDialog";

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  assignedResorts: Array<{
    resortId: string;
    resortName: string;
    role: string;
  }>;
  permissions?: {
    canManageBookings?: boolean;
    canManageRooms?: boolean;
    canManagePricing?: boolean;
    canManageAmenities?: boolean;
    canManageActivities?: boolean;
    canViewReports?: boolean;
    canManageBilling?: boolean;
    canManageHousekeeping?: boolean;
    canManageMaintenance?: boolean;
    canManageUsers?: boolean;
  };
}

const ManageFrontDesk = () => {
  const { showToast } = useAppContext();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getResortStaff();
      setStaff(response.data || []);
    } catch (error: any) {
      showToast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch staff",
        type: "ERROR"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = () => {
    setEditingStaff(null);
    setGeneratedCredentials(null);
    setDialogOpen(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setGeneratedCredentials(null);
    setDialogOpen(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm("Are you sure you want to deactivate this staff member?")) {
      return;
    }

    try {
      await apiClient.deleteResortStaff(staffId);
      showToast({ 
        title: "Success", 
        description: "Staff member deactivated successfully", 
        type: "SUCCESS" 
      });
      fetchStaff();
    } catch (error: any) {
      showToast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to deactivate staff", 
        type: "ERROR" 
      });
    }
  };

  const handleCopyCredentials = (email: string, password: string) => {
    const credentials = `Email: ${email}\nPassword: ${password}`;
    navigator.clipboard.writeText(credentials);
    showToast({ 
      title: "Copied", 
      description: "Credentials copied to clipboard", 
      type: "SUCCESS" 
    });
  };

  const handleDialogClose = (success: boolean) => {
    setDialogOpen(false);
    setEditingStaff(null);
    setGeneratedCredentials(null);
    if (success) {
      fetchStaff();
    }
  };

  const handleStaffCreated = (credentials: { email: string; password: string }) => {
    setGeneratedCredentials(credentials);
    setDialogOpen(false);
    showToast({ 
      title: "Success", 
      description: "Staff member created successfully", 
      type: "SUCCESS" 
    });
    fetchStaff();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8" />
            Manage Front Desk
          </h1>
          <p className="text-gray-600 mt-2">Create and manage front desk staff for your resorts</p>
        </div>
        <Button onClick={handleAddStaff} className="bg-primary-600 hover:bg-primary-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Staff
        </Button>
      </div>

      {/* Generated Credentials Display */}
      {generatedCredentials && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Key className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Staff Account Created</h3>
                <p className="text-sm text-green-700 mb-3">
                  Share these credentials with the new staff member. They will be required to change their password on first login.
                </p>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="font-mono text-sm mb-2">
                    <span className="text-gray-600">Email:</span> {generatedCredentials.email}
                  </p>
                  <p className="font-mono text-sm mb-3">
                    <span className="text-gray-600">Password:</span> {generatedCredentials.password}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyCredentials(generatedCredentials.email, generatedCredentials.password)}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Credentials
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setGeneratedCredentials(null)}
                  className="mt-3 text-green-700 hover:text-green-900"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      {staff.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Staff Members Yet</h3>
            <p className="text-gray-600 mb-4">Add your first front desk staff member to get started</p>
            <Button onClick={handleAddStaff} className="bg-primary-600 hover:bg-primary-700">
              <Plus className="h-4 w-4 mr-2" />
              Add First Staff Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((staffMember) => (
            <Card key={staffMember._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {staffMember.firstName} {staffMember.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{staffMember.email}</p>
                  </div>
                  <Badge
                    variant={staffMember.isActive ? "default" : "secondary"}
                    className={staffMember.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                  >
                    {staffMember.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Role</p>
                    <Badge variant="outline" className="mt-1">
                      {staffMember.role.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Assigned Resorts</p>
                    <div className="space-y-1">
                      {staffMember.assignedResorts.map((resort) => (
                        <div key={resort.resortId} className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                          {resort.resortName}
                        </div>
                      ))}
                    </div>
                  </div>

                  {staffMember.mustChangePassword && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm">
                      <RefreshCw className="h-4 w-4" />
                      <span>Pending password change</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditStaff(staffMember)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteStaff(staffMember._id)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deactivate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FrontDeskDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onStaffCreated={handleStaffCreated}
        editingStaff={editingStaff}
      />
    </div>
  );
};

export default ManageFrontDesk;
