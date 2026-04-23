import React from "react";
import { Navigate } from "react-router-dom";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { Loader2 } from "lucide-react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  fallbackPath?: string;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false,
  fallbackPath = "/",
}) => {
  const { isLoggedIn, isLoading, isAdmin, isSuperAdmin } = useRoleBasedAccess();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to home/404 if not logged in - DO NOT reveal admin login route
  if (!isLoggedIn) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check for admin requirement
  if (!isAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check for super admin requirement
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
