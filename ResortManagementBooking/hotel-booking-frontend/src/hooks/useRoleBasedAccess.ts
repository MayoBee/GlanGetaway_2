import useAppContext from "./useAppContext";

export const useRoleBasedAccess = () => {
  const { user, userRole, isLoggedIn, isLoading, isAuthLoading } = useAppContext();

  // Handle both "resort_owner" and "resort-owner" (hyphen or underscore)
  // Handle both "superAdmin" (DB value) and legacy "super_admin"
  const isSuperAdmin = userRole === "superAdmin" || userRole === "super_admin";
  const isResortOwner = userRole === "resort_owner" || userRole === "resort-owner";
  const isAdmin = userRole === "admin" || isSuperAdmin;
  const isFrontDesk = userRole === "front_desk";
  const isHousekeeping = userRole === "housekeeping";
  const isUser = userRole === "user" || isFrontDesk || isHousekeeping;

  const canCreateResort = isAdmin || isResortOwner;
  const canApproveResorts = isAdmin;
  const canManageAllUsers = isAdmin;
  const canViewAllResorts = isAdmin;
  const canManageOwnResorts = isAdmin || isResortOwner;
  const canBookResorts = isLoggedIn;
  const canManageBookings = isAdmin || isResortOwner || isFrontDesk;
  const canViewDashboard = isAdmin || isResortOwner || isFrontDesk || isHousekeeping;
  const canManageRooms = isAdmin || isResortOwner || isFrontDesk;
  const canManageHousekeeping = isAdmin || isResortOwner || isHousekeeping;
  const canManagePricing = isAdmin || isResortOwner;
  const canManageAmenities = isAdmin || isResortOwner;
  const canManageActivities = isAdmin || isResortOwner || isFrontDesk;
  const canViewReports = isAdmin || isResortOwner || isFrontDesk;
  const canManageBilling = isAdmin || isResortOwner || isFrontDesk;
  const canManageMaintenance = isAdmin || isResortOwner;
  
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
