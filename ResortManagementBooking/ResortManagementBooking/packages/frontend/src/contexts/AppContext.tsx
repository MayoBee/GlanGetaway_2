import React, { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useToast } from "../../../shared/hooks/use-toast";
import { UserType, UserRole } from "@shared/types";

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
  userRole: UserRole | null;
  isLoading: boolean;
  isAuthLoading: boolean;
};

export const AppContext = React.createContext<AppContext | undefined>(
  undefined
);

// Only load Stripe if the key is available to prevent initialization errors
const stripePromise = STRIPE_PUB_KEY ? loadStripe(STRIPE_PUB_KEY) : Promise.resolve(null);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState(
    "Loading..."
  );
  const [rateLimited, setRateLimited] = useState(false);
  const { toast } = useToast();

  // Simple token check
  const hasToken = !!localStorage.getItem("session_id");

  // Reset rate limit state when token changes
  React.useEffect(() => {
    setRateLimited(false);
  }, [hasToken]);

  // Fetch current user data in parallel with token validation for faster login
  const { isError, isLoading } = useQuery(
    "validateToken",
    apiClient.validateToken,
    {
      enabled: hasToken && !rateLimited, // Only run if we have a token and not rate limited
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // Increased to 30 minutes cache
      cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      onError: (error: any) => {
        console.log('🔍 Token validation error:', error);
        // If rate limited, stop further requests
        if (error.response?.status === 429) {
          setRateLimited(true);
          setTimeout(() => setRateLimited(false), 60000); // Retry after 1 minute
          return;
        }
        // Clear invalid token
        localStorage.removeItem("session_id");
        localStorage.removeItem("user_id");
      },
      onSuccess: (data) => {
        console.log('🔍 Token validation success:', data);
        setRateLimited(false);
      },
    }
  );

  // Fetch current user data in parallel (don't wait for validateToken to complete)
  const { data: userData } = useQuery(
    "currentUser",
    apiClient.fetchCurrentUser,
    {
      enabled: hasToken && !rateLimited, // Enable immediately if we have a token and not rate limited
      retry: false,
      staleTime: 30 * 60 * 1000, // Increased to 30 minutes cache
      cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      onError: (error: any) => {
        console.log('🔍 Current user fetch error:', error);
        // If rate limited, stop further requests
        if (error.response?.status === 429) {
          setRateLimited(true);
          setTimeout(() => setRateLimited(false), 60000); // Retry after 1 minute
        }
      },
      onSuccess: (data) => {
        console.log('🔍 Current user fetch success:', data);
        setRateLimited(false);
      },
    }
  );

  // Simple login state - don't wait for queries to complete if we have a token
  const isLoggedIn = hasToken && !isError;
  const user = userData || null;
  const userRole = userData?.role || null;
  
  // Don't block the entire app while loading user data - only show loading for auth-dependent components
  const isAuthLoading = hasToken && isLoading && !userData;

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
