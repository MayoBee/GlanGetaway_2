import useAppContext from "./useAppContext";
import { UserRole } from "../shared/types";

export const useRoleBasedAccess = () => {
  const { user, userRole, isLoggedIn, isLoading, isAuthLoading } = useAppContext();

  // Use correct UserRole enum values
  const isSuperAdmin = userRole === UserRole.SuperAdmin;
  const isResortOwner = userRole === UserRole.ResortOwner;
  const isAdmin = userRole === UserRole.Admin || isSuperAdmin;
  const isFrontDesk = userRole === UserRole.FrontDesk;
  const isHousekeeping = userRole === UserRole.Housekeeping;
  const isUser = userRole === UserRole.User || isFrontDesk || isHousekeeping;

  // Get user-specific permissions from database
  const userPermissions = user?.permissions || {};

  // Role-based defaults
  const roleBasedPermissions = {
    canCreateResort: isAdmin || isResortOwner,
    canApproveResorts: isAdmin,
    canManageAllUsers: isAdmin,
    canViewAllResorts: isAdmin,
    canManageOwnResorts: isAdmin || isResortOwner,
    canBookResorts: isLoggedIn,
    canManageBookings: isAdmin || isResortOwner || isFrontDesk,
    canViewDashboard: isAdmin || isResortOwner || isFrontDesk || isHousekeeping,
    canManageRooms: isAdmin || isResortOwner || isFrontDesk,
    canManageHousekeeping: isAdmin || isResortOwner || isHousekeeping,
    canManagePricing: isAdmin || isResortOwner,
    canManageAmenities: isAdmin || isResortOwner,
    canManageActivities: isAdmin || isResortOwner || isFrontDesk,
    canViewReports: isAdmin || isResortOwner || isFrontDesk,
    canManageBilling: isAdmin || isResortOwner || isFrontDesk,
    canManageMaintenance: isAdmin || isResortOwner,
  };

  // User-specific permissions override role-based defaults
  const canCreateResort = userPermissions.canManageUsers !== undefined ? userPermissions.canManageUsers : roleBasedPermissions.canCreateResort;
  const canApproveResorts = roleBasedPermissions.canApproveResorts;
  const canManageAllUsers = userPermissions.canManageUsers !== undefined ? userPermissions.canManageUsers : roleBasedPermissions.canManageAllUsers;
  const canViewAllResorts = roleBasedPermissions.canViewAllResorts;
  const canManageOwnResorts = roleBasedPermissions.canManageOwnResorts;
  const canBookResorts = roleBasedPermissions.canBookResorts;
  const canManageBookings = userPermissions.canManageBookings !== undefined ? userPermissions.canManageBookings : roleBasedPermissions.canManageBookings;
  const canViewDashboard = roleBasedPermissions.canViewDashboard;
  const canManageRooms = userPermissions.canManageRooms !== undefined ? userPermissions.canManageRooms : roleBasedPermissions.canManageRooms;
  const canManageHousekeeping = userPermissions.canManageHousekeeping !== undefined ? userPermissions.canManageHousekeeping : roleBasedPermissions.canManageHousekeeping;
  const canManagePricing = userPermissions.canManagePricing !== undefined ? userPermissions.canManagePricing : roleBasedPermissions.canManagePricing;
  const canManageAmenities = userPermissions.canManageAmenities !== undefined ? userPermissions.canManageAmenities : roleBasedPermissions.canManageAmenities;
  const canManageActivities = userPermissions.canManageActivities !== undefined ? userPermissions.canManageActivities : roleBasedPermissions.canManageActivities;
  const canViewReports = userPermissions.canViewReports !== undefined ? userPermissions.canViewReports : roleBasedPermissions.canViewReports;
  const canManageBilling = userPermissions.canManageBilling !== undefined ? userPermissions.canManageBilling : roleBasedPermissions.canManageBilling;
  const canManageMaintenance = userPermissions.canManageMaintenance !== undefined ? userPermissions.canManageMaintenance : roleBasedPermissions.canManageMaintenance;

  // Helper function to check if front desk user has any management permissions
  const hasAnyManagementPermission = isFrontDesk && (
    (canManageBookings || canManageRooms || 
     canManageAmenities || canManageActivities || 
     canViewReports || canManageBilling)
  );
  
  const requireAdmin = () => isAdmin;
  
  // Only log in development to reduce console noise
  if (process.env.NODE_ENV === 'development') {
    console.log("useRoleBasedAccess - Calculated permissions:", {
      canCreateResort,
      canApproveResorts,
      canManageAllUsers,
      canViewAllResorts,
      canManageOwnResorts,
      canBookResorts
    });
  }

  const getAccessibleRoutes = () => {
    if (!isLoggedIn) {
      return [
        "/",
        "/search",
        "/detail/:id",
        "/sign-in",
        "/register",
      ];
    }

    if (isSuperAdmin) {
      return [
        "/",
        "/search",
        "/detail/:id",
        "/my-bookings",
        "/my-hotels",
        "/profile",
      ];
    }

    if (isResortOwner) {
      return [
        "/",
        "/search",
        "/detail/:id",
        "/my-bookings",
        "/my-hotels",
        "/resort/reports",
        "/profile",
      ];
    }

    // Regular user
    return [
      "/",
      "/search",
      "/detail/:id",
      "/my-bookings",
      "/profile",
    ];
  };

  const canAccessRoute = (route: string) => {
    const accessibleRoutes = getAccessibleRoutes();
    
    // Check exact match or pattern match
    return accessibleRoutes.some(accessibleRoute => {
      if (accessibleRoute.includes(":")) {
        // Handle dynamic routes like "/detail/:id"
        const routePattern = accessibleRoute.replace(/:[^/]+/g, "[^/]+");
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(route);
      }
      return accessibleRoute === route;
    });
  };

  return {
    user,
    userRole,
    isLoggedIn,
    isLoading,
    isAuthLoading,
    isSuperAdmin,
    isResortOwner,
    isAdmin,
    isFrontDesk,
    isHousekeeping,
    isUser,
    canCreateResort,
    canApproveResorts,
    canManageAllUsers,
    canViewAllResorts,
    canManageOwnResorts,
    canBookResorts,
    canManageBookings,
    canViewDashboard,
    canManageRooms,
    canManageHousekeeping,
    canManagePricing,
    canManageAmenities,
    canManageActivities,
    canViewReports,
    canManageBilling,
    canManageMaintenance,
    hasAnyManagementPermission,
    requireAdmin,
    permissions: {
      canCreateResort,
      canApproveResorts,
      canManageAllUsers,
      canViewAllResorts,
      canManageOwnResorts,
      canBookResorts,
      canManageBookings,
      canViewDashboard,
      canManageRooms,
      canManageHousekeeping,
      canManagePricing,
      canManageAmenities,
      canManageActivities,
      canViewReports,
      canManageBilling,
      canManageMaintenance,
    },
    getAccessibleRoutes,
    canAccessRoute,
  };
};
