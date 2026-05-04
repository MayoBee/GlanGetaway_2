import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/ui/dialog";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Checkbox } from "../../../shared/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/ui/select";
import { RefreshCw, Copy, Check } from "lucide-react";
import * as apiClient from "../api-client";

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

interface FrontDeskDialogProps {
  open: boolean;
  onClose: (success: boolean) => void;
  onStaffCreated: (credentials: { email: string; password: string }) => void;
  editingStaff: StaffMember | null;
}

const FrontDeskDialog = ({ open, onClose, onStaffCreated, editingStaff }: FrontDeskDialogProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "front_desk",
    resortIds: [] as string[],
  });
  const [permissions, setPermissions] = useState({
    canManageBookings: true,
    canManageRooms: true,
    canManagePricing: false,
    canManageAmenities: false,
    canManageActivities: true,
    canViewReports: true,
    canManageBilling: true,
    canManageHousekeeping: false,
    canManageMaintenance: false,
    canManageUsers: false,
  });
  const [ownerResorts, setOwnerResorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOwnerResorts();
      if (editingStaff) {
        setFormData({
          firstName: editingStaff.firstName,
          lastName: editingStaff.lastName,
          email: editingStaff.email,
          password: "",
          role: editingStaff.role,
          resortIds: editingStaff.assignedResorts.map((r) => r.resortId),
        });
        if (editingStaff.permissions) {
          setPermissions(editingStaff.permissions);
        }
      } else {
        resetForm();
      }
    }
  }, [open, editingStaff]);

  const fetchOwnerResorts = async () => {
    try {
      const resorts = await apiClient.fetchMyHotels();
      setOwnerResorts(resorts);
    } catch (error) {
      console.error("Failed to fetch owner resorts:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "front_desk",
      resortIds: [],
    });
    setPermissions({
      canManageBookings: true,
      canManageRooms: true,
      canManagePricing: false,
      canManageAmenities: false,
      canManageActivities: true,
      canViewReports: true,
      canManageBilling: true,
      canManageHousekeeping: false,
      canManageMaintenance: false,
      canManageUsers: false,
    });
    setGeneratedPassword("");
    setPasswordCopied(false);
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(formData.password);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingStaff) {
        await apiClient.updateResortStaff(editingStaff._id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          resortIds: formData.resortIds,
          permissions,
        });
        onClose(true);
      } else {
        const response = await apiClient.createResortStaff({
          ...formData,
          resortIds: formData.resortIds,
          permissions,
        });
        onStaffCreated({ email: formData.email, password: formData.password });
        resetForm();
        onClose(true);
      }
    } catch (error: any) {
      console.error("Failed to save staff:", error);
      alert(error.response?.data?.message || "Failed to save staff member");
    } finally {
      setLoading(false);
    }
  };

  const toggleResort = (resortId: string) => {
    setFormData({
      ...formData,
      resortIds: formData.resortIds.includes(resortId)
        ? formData.resortIds.filter((id) => id !== resortId)
        : [...formData.resortIds, resortId],
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          <DialogDescription>
            {editingStaff
              ? "Update staff member details and resort assignments"
              : "Create a new front desk staff account and assign them to your resorts"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading || !!editingStaff}
            />
          </div>

          {/* Password - Only for new staff */}
          {!editingStaff && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  placeholder="Enter password or generate one"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate
                </Button>
                {formData.password && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyPassword}
                    disabled={loading}
                  >
                    {passwordCopied ? (
                      <Check className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    {passwordCopied ? "Copied!" : "Copy"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Staff will be required to change this password on first login
              </p>
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front_desk">Front Desk</SelectItem>
                <SelectItem value="housekeeping">Housekeeping</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Resort Assignments */}
          <div className="space-y-2">
            <Label>Assign to Resorts *</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {ownerResorts.length === 0 ? (
                <p className="text-sm text-gray-500">No resorts available. Add a resort first.</p>
              ) : (
                ownerResorts.map((resort) => (
                  <div key={resort._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`resort-${resort._id}`}
                      checked={formData.resortIds.includes(resort._id)}
                      onChange={() => toggleResort(resort._id)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor={`resort-${resort._id}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {resort.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(permissions).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`perm-${key}`}
                    checked={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPermissions({ ...permissions, [key]: e.target.checked as boolean })
                    }
                    disabled={loading}
                  />
                  <Label
                    htmlFor={`perm-${key}`}
                    className="cursor-pointer font-normal text-sm"
                  >
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || formData.resortIds.length === 0}>
              {loading ? "Saving..." : editingStaff ? "Update Staff" : "Create Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FrontDeskDialog;
