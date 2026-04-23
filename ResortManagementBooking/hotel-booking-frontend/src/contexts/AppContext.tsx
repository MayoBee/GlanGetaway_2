import React, { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuery } from "react-query";
import { validateToken, fetchCurrentUser } from "@glan-getaway/shared-auth";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useToast } from "../hooks/use-toast";
import { UserType } from "../../../shared/types";

const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

type ToastMessage = {
  title: string;
  description?: string;
  type: "SUCCESS" | "ERROR" | "INFO";
};

export type AppContext = {
  showToast: (toastMessage: ToastMessage) => void;
  isLoggedIn: boolean;
  stripePromise: Promise<Stripe | null>;
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  user: UserType | null;
  userRole: "user" | "admin" | "resort_owner" | "resort-owner" | "front_desk" | "housekeeping" | "superAdmin" | "super_admin" | null;
  isLoading: boolean;
  isAuthLoading: boolean;
};

export const AppContext = React.createContext<AppContext | undefined>(
  undefined
);

const stripePromise = loadStripe(STRIPE_PUB_KEY);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState(
    "Loading..."
  );
  const { toast } = useToast();

  // Simple token check
  const hasToken = !!localStorage.getItem("session_id");

  // Fetch current user data in parallel with token validation for faster login
  const { isError, isLoading } = useQuery(
    "validateToken",
    validateToken,
    {
      enabled: hasToken, // Only run if we have a token
      retry: 1, // Retry once on failure
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - check more frequently
      cacheTime: 10 * 60 * 1000,
      onError: (error: any) => {
        // Only clear tokens on actual auth errors (401), NOT on network errors
        // Network errors mean the backend is down, not that the user is logged out
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                              error.message?.includes('Network Error') ||
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED');
        
        if (!isNetworkError) {
          // Only clear if it's an actual auth failure (401), not backend unavailable
          if (error.response?.status === 401) {
            localStorage.removeItem("session_id");
            localStorage.removeItem("user_id");
            localStorage.removeItem("user_email");
            localStorage.removeItem("user_name");
          }
        }
      },
    }
  );

  // Fetch current user data in parallel
  const { data: userData, isError: userFetchError } = useQuery(
    "currentUser",
    fetchCurrentUser,
    {
      enabled: hasToken, // Enable immediately if we have a token
      retry: 1,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: any) => {
        // Only clear on actual auth failures, not network errors
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                              error.message?.includes('Network Error') ||
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED');
        
        if (!isNetworkError && error.response?.status === 401) {
          localStorage.removeItem("session_id");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_email");
          localStorage.removeItem("user_name");
        }
      },
      onSuccess: (data) => {
        // Store user role in localStorage for ProtectedRoute to use
        if (data?.role) {
          localStorage.setItem("user_role", data.role);
        }
      },
    }
  );

  // IMPORTANT: User is logged in if they have a token, regardless of backend status
  // This prevents being logged out when backend is temporarily down
  const isLoggedIn = hasToken;
  const user = userData as unknown as UserType || null;
  const userRole = userData?.role as "user" | "admin" | "resort_owner" | "resort-owner" | "front_desk" | "housekeeping" | "superAdmin" | "super_admin" | null || null;
  
  // Show auth loading only during initial load, not for every API call
  const isAuthLoading = hasToken && !userData && !userFetchError;

  const showToast = (toastMessage: ToastMessage) => {
    const variant =
      toastMessage.type === "SUCCESS"
        ? "success"
        : toastMessage.type === "ERROR"
        ? "destructive"
        : "info";

    toast({
      variant,
      title: toastMessage.title,
      description: toastMessage.description,
    });
  };

  const showGlobalLoading = (message?: string) => {
    if (message) {
      setGlobalLoadingMessage(message);
    }
    setIsGlobalLoading(true);
  };

  const hideGlobalLoading = () => {
    setIsGlobalLoading(false);
  };

  return (
    <AppContext.Provider
      value={{
        showToast,
        isLoggedIn,
        stripePromise,
        showGlobalLoading,
        hideGlobalLoading,
        isGlobalLoading,
        globalLoadingMessage,
        user,
        userRole,
        isLoading,
        isAuthLoading,
      }}
    >
      {isGlobalLoading && <LoadingSpinner message={globalLoadingMessage} />}
      {children}
    </AppContext.Provider>
  );
};

// ...existing code...
