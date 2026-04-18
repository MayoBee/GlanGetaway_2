import React, { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuery } from "react-query";
import * as apiClient from "../api-client";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useToast } from "../../../shared/hooks/use-toast";
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
  userRole: "user" | "admin" | "resort_owner" | "resort-owner" | "front_desk" | "housekeeping" | "superAdmin" | null;
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
    apiClient.validateToken,
    {
      enabled: hasToken, // Only run if we have a token
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // Increased to 30 minutes cache
      cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      onError: (error) => {
        console.log('🔍 Token validation error:', error);
        // Clear invalid token
        localStorage.removeItem("session_id");
        localStorage.removeItem("user_id");
      },
      onSuccess: (data) => {
        console.log('🔍 Token validation success:', data);
      },
    }
  );

  // Fetch current user data in parallel (don't wait for validateToken to complete)
  const { data: userData } = useQuery(
    "currentUser",
    apiClient.fetchCurrentUser,
    {
      enabled: hasToken, // Enable immediately if we have a token
      retry: false,
      staleTime: 30 * 60 * 1000, // Increased to 30 minutes cache
      cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      onError: (error) => {
        console.log('🔍 Current user fetch error:', error);
      },
      onSuccess: (data) => {
        console.log('🔍 Current user fetch success:', data);
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
