import React from "react";
import { Navigate } from "react-router-dom";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof ReturnType<typeof useRoleBasedAccess>["permissions"];
  requireAdmin?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAdmin = false,
  fallbackPath = "/",
}) => {
  const { isLoggedIn, isLoading, isAdmin, permissions } = useRoleBasedAccess();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not logged in
  if (!isLoggedIn) {
    return <Navigate to="/sign-in" state={{ from: window.location.pathname }} replace />;
  }

  // Check for specific permission
  if (requiredPermission && !permissions[requiredPermission]) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check for admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
