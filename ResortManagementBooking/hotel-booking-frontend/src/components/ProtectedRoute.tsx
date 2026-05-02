import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  bypassRoleCheck?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  bypassRoleCheck = false,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check localStorage values set by AppContext
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');

    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }

    setIsValidating(false);
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



  return <>{children}</>;
};

export default ProtectedRoute;

