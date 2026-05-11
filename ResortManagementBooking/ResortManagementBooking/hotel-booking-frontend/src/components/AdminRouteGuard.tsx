import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../contexts/AdminAuthContext";

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * AdminRouteGuard - Higher-Order Component for protecting admin routes
 * 
 * This component checks if the user has admin privileges (isAdmin flag set).
 * If not authenticated as admin, redirects to /admin-login.
 * 
 * The "Universal Access" Logic:
 * - Any user who successfully authenticates through /admin-login gets isAdmin: true
 * - This grants full access to all dashboard modules regardless of their standard user profile
 * - Permission checks are bypassed when isAdmin is true
 */
const AdminRouteGuard: React.FC<AdminRouteGuardProps> = ({ children }) => {
  const { isAdmin } = useAdminAuth();
  const location = useLocation();

  // Check if user has admin privileges
  if (!isAdmin) {
    // Redirect to admin-login with the intended destination
    // Note: Users MUST log in through /admin-login to get admin privileges
    // Regular /sign-in does not grant admin access
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  // User has admin privileges, render the protected content
  return <>{children}</>;
};

export default AdminRouteGuard;

