// Shared Authentication Package
// This package provides reusable authentication components for both main frontend and admin dashboard

// Export API client and auth functions
export { default as axiosInstance, getApiBaseUrl, signIn, signOut, validateToken, fetchCurrentUser, cancelAllRequests, isRequestCanceled } from './api-client';
export type { SignInFormData, AuthResponse } from './api-client';

// Export ProtectedRoute component
export { default as ProtectedRoute } from './ProtectedRoute';

// Export useAuth hook
export { default as useAuth } from './useAuth';
