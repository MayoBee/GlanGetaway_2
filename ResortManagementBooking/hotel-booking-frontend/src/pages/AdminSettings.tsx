import React, { useState } from "react";
import useAppContext from "../hooks/useAppContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Settings as SettingsIcon, Shield, Bell, Lock, User, Globe, Save } from "lucide-react";
import { signOut } from "@glan-getaway/shared-auth";
import { useNavigate } from "react-router-dom";

const AdminSettings: React.FC = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
        type: "SUCCESS",
      });
      navigate("/admin-login");
    } catch (error) {
      showToast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        type: "ERROR",
      });
    }
  };

  const handleSaveSettings = () => {
    setSaving(true);
    // Simulate saving settings
    setTimeout(() => {
      setSaving(false);
      showToast({
        title: "Settings Saved",
        description: "Your settings have been successfully saved.",
        type: "SUCCESS",
      });
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <SettingsIcon className="w-8 h-8 mr-3 text-primary-600" />
          Admin Settings
        </h1>
        <p className="text-gray-600">
          Manage your admin account settings and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your admin account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Display Name
                </label>
                <Input placeholder="Admin User" disabled />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Email
                </label>
                <Input placeholder="admin@glangetaway.com" disabled />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Role
              </label>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                <Shield className="w-3 h-3 mr-1" />
                Administrator
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Add an extra layer of security</p>
              </div>
              <Button variant="outline" disabled>
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Change Password</p>
                <p className="text-sm text-gray-600">Update your password regularly</p>
              </div>
              <Button variant="outline" disabled>
                Change
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
              <Button variant="outline" disabled>
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-600">Receive real-time alerts</p>
              </div>
              <Button variant="outline" disabled>
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              System Settings
            </CardTitle>
            <CardDescription>
              Global system configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Maintenance Mode</p>
                <p className="text-sm text-gray-600">Temporarily disable the platform</p>
              </div>
              <Button variant="outline" disabled>
                Toggle
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">System Logs</p>
                <p className="text-sm text-gray-600">View system activity logs</p>
              </div>
              <Button variant="outline" disabled>
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <SettingsIcon className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
