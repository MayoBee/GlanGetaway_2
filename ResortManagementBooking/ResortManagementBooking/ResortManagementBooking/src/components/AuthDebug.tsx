import React, { useState } from "react";
import useAppContext from "../hooks/useAppContext";
import axiosInstance from "../shared/auth/api-client";
import { Badge } from "../shared/ui/badge";
import { Button } from "../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../shared/ui/card";
import { CheckCircle, XCircle, AlertTriangle, User, Shield, Settings } from "lucide-react";

const AuthDebug: React.FC = () => {
  const { user, userRole, isLoggedIn, isLoading } = useAppContext();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runAuthTest = async () => {
    setLoading(true);
    const results = [];
    
    try {
      // Test 1: Public route
      try {
        await axiosInstance.get("/api/debug-auth/test-public");
        results.push({
          test: "Public API Access",
          status: "success",
          message: "Public API is working",
          icon: CheckCircle
        });
      } catch (error: any) {
        results.push({
          test: "Public API Access",
          status: "error",
          message: error.response?.data?.message || error.message,
          icon: XCircle
        });
      }

      // Test 2: Authenticated route
      try {
        const response = await axiosInstance.get("/api/debug-auth/test-auth");
        results.push({
          test: "Authenticated API Access",
          status: "success",
          message: response.data.message,
          details: `User ID: ${response.data.userId}`,
          icon: CheckCircle
        });
      } catch (error: any) {
        results.push({
          test: "Authenticated API Access",
          status: "error",
          message: error.response?.data?.message || error.message,
          details: `Status: ${error.response?.status}`,
          icon: XCircle
        });
      }

      // Test 3: Current user info
      try {
        const response = await axiosInstance.get("/api/debug-auth/current-user");
        results.push({
          test: "Current User Info",
          status: "success",
          message: "User data retrieved",
          details: response.data,
          icon: CheckCircle
        });
      } catch (error: any) {
        results.push({
          test: "Current User Info",
          status: "error",
          message: error.response?.data?.message || error.message,
          details: `Status: ${error.response?.status}`,
          icon: XCircle
        });
      }

      // Test 4: Website Feedback (Admin only)
      try {
        await axiosInstance.get("/api/website-feedback");
        results.push({
          test: "Website Feedback Access",
          status: "success",
          message: "Admin access granted",
          icon: CheckCircle
        });
      } catch (error: any) {
        results.push({
          test: "Website Feedback Access",
          status: "error",
          message: error.response?.data?.message || error.message,
          details: `Status: ${error.response?.status} - This requires admin role`,
          icon: error.response?.status === 403 ? AlertTriangle : XCircle
        });
      }

      // Test 5: Reports (Admin only)
      try {
        await axiosInstance.get("/api/reports");
        results.push({
          test: "Reports Access",
          status: "success",
          message: "Admin access granted",
          icon: CheckCircle
        });
      } catch (error: any) {
        results.push({
          test: "Reports Access",
          status: "error",
          message: error.response?.data?.message || error.message,
          details: `Status: ${error.response?.status} - This requires admin role`,
          icon: error.response?.status === 403 ? AlertTriangle : XCircle
        });
      }

      // Test 6: Admin Management (Super Admin only)
      try {
        await axiosInstance.get("/api/admin-management/users");
        results.push({
          test: "Admin Management Access",
          status: "success",
          message: "Super admin access granted",
          icon: CheckCircle
        });
      } catch (error: any) {
        results.push({
          test: "Admin Management Access",
          status: "error",
          message: error.response?.data?.message || error.message,
          details: `Status: ${error.response?.status} - This requires super admin role`,
          icon: error.response?.status === 403 ? AlertTriangle : XCircle
        });
      }

    } catch (error: any) {
      results.push({
        test: "General Error",
        status: "error",
        message: error.message,
        icon: XCircle
      });
    }
    
    setTestResults(results);
    setLoading(false);
  };

  const promoteToAdmin = async () => {
    try {
      const response = await axiosInstance.put("/api/quick-fix-admin/promote-me-to-admin");
      alert(`Success! ${response.data.message}\n\nOld role: ${response.data.user.oldRole}\nNew role: ${response.data.user.newRole}\n\nPlease refresh the page to update your permissions.`);
      window.location.reload();
    } catch (error: any) {
      alert(`Failed to promote user: ${error.response?.data?.message || error.message}`);
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case "resort_owner":
        return <Badge className="bg-blue-100 text-blue-800"><Settings className="w-3 h-3 mr-1" />Resort Owner</Badge>;
      case "user":
        return <Badge className="bg-gray-100 text-gray-800"><User className="w-3 h-3 mr-1" />User</Badge>;
      default:
        return <Badge variant="outline">Unknown Role</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Authentication Debug Tool
          </CardTitle>
          <CardDescription>
            Test your authentication status and permissions for admin features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Current User Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Current User Status</h3>
            {isLoading ? (
              <p>Loading user information...</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Logged In:</span>
                  {isLoggedIn ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                {user && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Email:</span>
                      <span className="text-sm">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Name:</span>
                      <span className="text-sm">{user.firstName} {user.lastName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Role:</span>
                      {getRoleBadge(userRole)}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Test Button */}
          <div className="flex gap-3 mb-6">
            <Button 
              onClick={runAuthTest} 
              disabled={loading || !isLoggedIn}
              className="flex-1"
            >
              {loading ? "Running Tests..." : "Run Authentication Tests"}
            </Button>
            
            {userRole !== "admin" && isLoggedIn && (
              <Button 
                onClick={promoteToAdmin}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Shield className="w-4 h-4 mr-2" />
                Quick Fix: Promote to Admin
              </Button>
            )}
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Test Results</h3>
              {testResults.map((result, index) => {
                const IconComponent = result.icon;
                return (
                  <Card key={index} className={
                    result.status === "success" ? "border-green-200 bg-green-50" :
                    result.status === "error" && result.details?.includes("403") ? "border-yellow-200 bg-yellow-50" :
                    "border-red-200 bg-red-50"
                  }>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <IconComponent className={`w-5 h-5 mt-0.5 ${
                          result.status === "success" ? "text-green-600" :
                          result.status === "error" && result.details?.includes("403") ? "text-yellow-600" :
                          "text-red-600"
                        }`} />
                        <div className="flex-1">
                          <div className="font-medium">{result.test}</div>
                          <div className="text-sm mt-1">{result.message}</div>
                          {result.details && (
                            <div className="text-xs text-gray-600 mt-1">
                              {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Recommendations */}
          {testResults.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Recommendations</h3>
              <ul className="text-sm space-y-1">
                {testResults.some(r => r.test === "Current User Info" && r.status === "error") && (
                  <li>• Your authentication token may be expired. Try logging out and logging back in.</li>
                )}
                {testResults.some(r => r.test.includes("Access") && r.status === "error" && r.details?.includes("403")) && (
                  <li>• You don't have the required admin role. Contact a super admin to upgrade your account.</li>
                )}
                {testResults.some(r => r.test === "Authenticated API Access" && r.status === "error") && (
                  <li>• Your session may be invalid. Please refresh the page and try again.</li>
                )}
                {testResults.every(r => r.status === "success") && (
                  <li>• All tests passed! You have full admin access.</li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthDebug;
