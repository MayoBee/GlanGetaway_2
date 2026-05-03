import React, { useState, useCallback, useRef, useMemo } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useQuery } from "react-query";
import axios from "axios";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { useToast } from "../hooks/use-toast";
import { UserType } from "../../../shared/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Debounced logout to prevent multiple concurrent 401s from triggering multiple logouts
let logoutTimeout: NodeJS.Timeout | null = null;
const debouncedLogout = (reason: string) => {
  if (logoutTimeout) {
    clearTimeout(logoutTimeout);
  }
  
  logoutTimeout = setTimeout(() => {
    console.log(`Debounced logout triggered: ${reason}`);
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    window.location.href = '/sign-in';
    logoutTimeout = null;
  }, 1000); // 1 second debounce
};

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    // Standardize on 'token' for consistency
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

const validateToken = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/validate-token");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check if JWT token is expired or about to expire
const checkTokenExpiration = (): { isValid: boolean; willExpireSoon: boolean; timeUntilExpiry: number } => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { isValid: false, willExpireSoon: false, timeUntilExpiry: 0 };
  }

  try {
    // Parse JWT payload (base64 decoded)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp;
    
    if (!exp) {
      return { isValid: true, willExpireSoon: false, timeUntilExpiry: Infinity };
    }
    
    const timeUntilExpiry = exp - now;
    const isValid = timeUntilExpiry > 0;
    const willExpireSoon = timeUntilExpiry > 0 && timeUntilExpiry < 300; // 5 minutes
    
    return { isValid, willExpireSoon, timeUntilExpiry };
  } catch (error) {
    console.warn('Failed to parse JWT token:', error);
    return { isValid: false, willExpireSoon: false, timeUntilExpiry: 0 };
  }
};

// Proactive token refresh before critical actions
const ensureValidToken = async (): Promise<boolean> => {
  const { isValid, willExpireSoon } = checkTokenExpiration();
  
  if (!isValid) {
    // Token is expired, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    window.location.href = '/sign-in';
    return false;
  }
  
  if (willExpireSoon) {
    try {
      // Try to refresh token by validating
      await validateToken();
      return true;
    } catch (error) {
      // Refresh failed, clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_role');
      window.location.href = '/sign-in';
      return false;
    }
  }
  
  return true;
};

const fetchCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

const STRIPE_PUB_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

type ToastMessage = {
  title: string;
  description?: string;
  type: "SUCCESS" | "ERROR" | "INFO";
};

export type AppContext = {
  showToast: (toastMessage: ToastMessage) => void;
  isLoggedIn: boolean;
  stripePromise: Promise<Stripe | null> | null;
  stripeError: string | null;
  availablePaymentMethods: string[];
  showGlobalLoading: (message?: string) => void;
  hideGlobalLoading: () => void;
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  user: UserType | null;
  userRole: "user" | "admin" | "resort_owner" | "resort-owner" | "front_desk" | "housekeeping" | "superAdmin" | "super_admin" | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  ensureValidToken: () => Promise<boolean>;
  checkTokenExpiration: () => { isValid: boolean; willExpireSoon: boolean; timeUntilExpiry: number };
};

export const AppContext = React.createContext<AppContext | undefined>(
  undefined
);



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

  // Enhanced Stripe loading with error handling and retry logic
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeRetryCount, setStripeRetryCount] = useState(0);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['gcash']); // GCash always available

  // Enhanced Stripe loading with retry mechanism
  const loadStripeWithRetry = useCallback(async (retries = 0): Promise<Stripe | null> => {
    try {
      const stripe = await loadStripe(STRIPE_PUB_KEY);
      if (!stripe && retries < 3) {
        console.warn(`Stripe loading failed (attempt ${retries + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return loadStripeWithRetry(retries + 1);
      }
      return stripe;
    } catch (error) {
      console.error('Stripe loading error:', error);
      if (retries < 2) {
        return loadStripeWithRetry(retries + 1);
      }
      setStripeError('Payment system temporarily unavailable. Please refresh or try alternative payment methods.');
      return null;
    }
  }, []);

  // Initialize Stripe on mount
  React.useEffect(() => {
    setStripePromise(loadStripeWithRetry());
  }, [loadStripeWithRetry]);

  // Detect payment method availability
  React.useEffect(() => {
    if (stripePromise) {
      stripePromise.then(stripe => {
        if (stripe) {
          setAvailablePaymentMethods(prev => [...prev, 'stripe']);
        }
      });
    }
  }, [stripePromise]);

  // Standardize on 'token' for authentication detection
  const hasToken = !!localStorage.getItem("token");

  // Fetch current user data in parallel with token validation for faster login
  const { isError, isLoading } = useQuery(
    "validateToken",
    validateToken,
    {
      enabled: hasToken, // Only run if we have a token
      retry: (failureCount, error) => {
        // Only retry on network errors, not 401s
        if (error?.response?.status === 401) return false;
        if (error?.message?.includes('Failed to fetch')) return false;
        if (error?.message?.includes('Network Error')) return false;
        if (error?.code === 'ECONNREFUSED') return false;
        if (error?.message?.includes('ERR_CONNECTION_REFUSED')) return false;
        return failureCount < 2; // Retry twice for network issues
      },
      refetchOnWindowFocus: false,
      staleTime: 1000, // 1 second to prevent stale data during login
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
      onError: (error: any) => {
        // Enhanced error handling for better resilience
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                              error.message?.includes('Network Error') ||
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED') ||
                              error.message?.includes('ERR_CONNECTION_RESET');
        
        const isCORS_ERROR = error.message?.includes('CORS') || 
                            error.message?.includes('Access-Control');
        
        const isTimeoutError = error.code === 'ECONNABORTED' || 
                              error.message?.includes('timeout');
        
        // Log error for debugging
        console.warn('Token validation error:', {
          type: isNetworkError ? 'Network' : isCORS_ERROR ? 'CORS' : isTimeoutError ? 'Timeout' : 'Auth',
          message: error.message,
          status: error.response?.status,
          code: error.code
        });
        
        // Only clear tokens on actual auth failures (401), not on network/CORS issues
        if (!isNetworkError && !isCORS_ERROR && !isTimeoutError) {
          if (error.response?.status === 401) {
            debouncedLogout('Token validation 401 error');
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
        // Enhanced error handling for better resilience
        const isNetworkError = error.message?.includes('Failed to fetch') || 
                              error.message?.includes('Network Error') ||
                              error.code === 'ECONNREFUSED' ||
                              error.message?.includes('ERR_CONNECTION_REFUSED') ||
                              error.message?.includes('ERR_CONNECTION_RESET');
        
        const isCORS_ERROR = error.message?.includes('CORS') || 
                            error.message?.includes('Access-Control');
        
        const isTimeoutError = error.code === 'ECONNABORTED' || 
                              error.message?.includes('timeout');
        
        // Log error for debugging
        console.warn('Current user fetch error:', {
          type: isNetworkError ? 'Network' : isCORS_ERROR ? 'CORS' : isTimeoutError ? 'Timeout' : 'Auth',
          message: error.message,
          status: error.response?.status,
          code: error.code
        });
        
        // Only clear tokens on actual auth failures (401), not on network/CORS issues
        if (!isNetworkError && !isCORS_ERROR && !isTimeoutError) {
          if (error.response?.status === 401) {
            debouncedLogout('Token validation 401 error');
          }
        }
      },
      onSuccess: (data) => {
        // Store user role in localStorage for ProtectedRoute to use
        if (data?.user?.role) {
          localStorage.setItem("user_role", data.user.role);
        }
      },
    }
  );

  // IMPORTANT: User is logged in if they have a token, regardless of backend status
  // This prevents being logged out when backend is temporarily down
  const isLoggedIn = hasToken;
  const user = userData?.user as unknown as UserType || null;
  const userRole = userData?.user?.role as "user" | "admin" | "resort_owner" | "resort-owner" | "front_desk" | "housekeeping" | "superAdmin" | "super_admin" | null || null;
  
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

  const showGlobalLoading = useCallback((message?: string) => {
    if (message) {
      setGlobalLoadingMessage(message);
    }
    setIsGlobalLoading(true);
  }, []);

  const hideGlobalLoading = useCallback(() => {
    setIsGlobalLoading(false);
  }, []);

  const contextValue = useMemo(() => ({
    showToast,
    isLoggedIn,
    stripePromise,
    stripeError,
    availablePaymentMethods,
    showGlobalLoading,
    hideGlobalLoading,
    isGlobalLoading,
    globalLoadingMessage,
    user,
    userRole,
    isLoading,
    isAuthLoading,
    ensureValidToken,
    checkTokenExpiration,
  }), [
    showToast,
    isLoggedIn,
    stripePromise,
    stripeError,
    availablePaymentMethods,
    showGlobalLoading,
    hideGlobalLoading,
    isGlobalLoading,
    globalLoadingMessage,
    user,
    userRole,
    isLoading,
    isAuthLoading,
    ensureValidToken,
    checkTokenExpiration,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {isGlobalLoading && <LoadingSpinner message={globalLoadingMessage} />}
      {children}
    </AppContext.Provider>
  );
};

// ...existing code...

