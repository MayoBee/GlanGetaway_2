import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axiosInstance from "./api-client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: string;
  bypassRoleCheck?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requiredPermission,
  bypassRoleCheck = false,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        // First check localStorage for quick validation
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
        const localRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
        const localPermissions = typeof window !== 'undefined' ? localStorage.getItem('user_permissions') : null;

        if (!localToken) {
          setIsAuthenticated(false);
          setIsValidating(false);
          return;
        }

        // Parse permissions if available
        if (localPermissions) {
          try {
            setUserPermissions(JSON.parse(localPermissions));
          } catch {
            setUserPermissions([]);
          }
        }

        // Validate token with backend
        const response = await axiosInstance.get("/api/auth/validate-token");

        if (response.data?.userId) {
          setIsAuthenticated(true);
          
          // If role not in localStorage, fetch it from /api/users/me
          let role = localRole;
          if (!role) {
            try {
              const userResponse = await axiosInstance.get("/api/users/me");
              role = userResponse.data?.role || null;
              if (role) {
                localStorage.setItem('user_role', role);
              }
            } catch {
              // If fetching user fails, role remains null
            }
          }
          setUserRole(role);
          
          // Store permissions if returned from API
          if (response.data.permissions) {
            setUserPermissions(response.data.permissions);
            localStorage.setItem('user_permissions', JSON.stringify(response.data.permissions));
          }
        } else {
          localStorage.removeItem('session_id');
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_permissions');
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        // If validation fails, check if we have a token in localStorage as fallback
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
        let localRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
        const localPermissions = typeof window !== 'undefined' ? localStorage.getItem('user_permissions') : null;
        
        if (localToken) {
          // Fallback: if API call fails but token exists locally, try to fetch role
          setIsAuthenticated(true);
          
          if (!localRole) {
            try {
              const userResponse = await axiosInstance.get("/api/users/me");
              localRole = userResponse.data?.role || null;
              if (localRole) {
                localStorage.setItem('user_role', localRole);
              }
            } catch {
              // If fetching user fails, role remains whatever was in localStorage (may be null)
            }
          }
          setUserRole(localRole);
          
          if (localPermissions) {
            try {
              setUserPermissions(JSON.parse(localPermissions));
            } catch {
              setUserPermissions([]);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, []);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to admin-login if admin access is required, otherwise to sign-in
    const redirectPath = requireAdmin ? "/admin-login" : "/sign-in";
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Skip role checks if bypassRoleCheck is enabled (for admin portal access)
  if (bypassRoleCheck) {
    return <>{children}</>;
  }

  // Validate admin access if required
  if (requireAdmin) {
    const adminRoles = ["admin"];
    if (!adminRoles.includes(userRole ?? "")) {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }
  }

  // Validate specific permission if required
  if (requiredPermission) {
    if (!userPermissions.includes(requiredPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
