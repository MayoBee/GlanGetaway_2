import { useAdminAuth } from "../contexts/AdminAuthContext";

/**
 * useAdminBypass - Hook for components to check if they should bypass permission checks
 * 
 * This hook returns true if the current session has admin privileges.
 * Dashboard components can use this to conditionally render UI elements
 * based on whether the user is a Super Admin.
 * 
 * Usage:
 *   const { isAdmin } = useAdminBypass();
 *   
 *   if (isAdmin) {
 *     // Show all UI elements (Delete buttons, Edit forms, Sensitive Data)
 *   } else {
 *     // Apply standard permission checks
 *   }
 */
export const useAdminBypass = () => {
  const { isAdmin } = useAdminAuth();
  
  return {
    isAdmin,
    canBypassPermissions: isAdmin,
  };
};
