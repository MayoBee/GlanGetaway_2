import { axiosInstance, getApiBaseUrl } from "@shared/auth";
import { RegisterFormData } from "./pages/Register";
import { SignInFormData } from "./pages/SignIn";
import {
  HotelSearchResponse,
  HotelType,
  PaymentIntentResponse,
  UserType,
  HotelWithBookingsType,
  BookingType,
} from "@shared/types";
import { BookingFormData } from "./forms/BookingForm/BookingForm";

export { getApiBaseUrl };

export const fetchCurrentUser = async (): Promise<UserType> => {
  const response = await axiosInstance.get("/api/users/me");
  return response.data;
};

export const register = async (formData: RegisterFormData) => {
  try {
    const response = await axiosInstance.post("/api/users/register", formData);

    // Store token and user info after successful registration (same as signIn)
    const token = response.data?.token;
    if (token) {
      localStorage.setItem("session_id", token);
    }

    if (response.data?.userId) {
      localStorage.setItem("user_id", response.data.userId);
    }
    if (response.data?.user) {
      const { email, firstName, lastName } = response.data.user;
      if (email) localStorage.setItem("user_email", email);
      const name = [firstName, lastName].filter(Boolean).join(" ") || email;
      if (name) localStorage.setItem("user_name", name);
    }

    return response.data;
  } catch (error: any) {
    // Enhanced error handling
    if (error.response?.status === 409) {
      throw new Error("An account with this email already exists. Please use a different email or sign in.");
    } else if (error.response?.status === 400) {
      throw new Error("Invalid registration data. Please check your information and try again.");
    } else if (error.response?.status === 429) {
      throw new Error("Too many registration attempts. Please try again later.");
    } else if (error.code === "NETWORK_ERROR") {
      throw new Error("Network error. Please check your connection and try again.");
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Registration failed. Please try again.");
    }
  }
};

export const signIn = async (formData: SignInFormData) => {
  try {
    console.log('🔍 Attempting sign in with:', { email: formData.email });
    
    const response = await axiosInstance.post("/api/auth/login", formData);

    console.log('🔍 Login response:', response.data);

    // Optimized token storage - use synchronous operations
    const token = response.data?.token;
    if (token) {
      localStorage.setItem("session_id", token);
      console.log('🔍 Token stored in localStorage');
    }

    // Batch user info storage for better performance
    if (response.data?.userId) {
      localStorage.setItem("user_id", response.data.userId);
    }
    if (response.data?.user) {
      const { email, firstName, lastName } = response.data.user;
      if (email) localStorage.setItem("user_email", email);
      const name = [firstName, lastName].filter(Boolean).join(" ") || email;
      if (name) localStorage.setItem("user_name", name);
    }

    console.log('🔍 Login successful, returning data');
    return response.data;
  } catch (error: any) {
    console.log('🔍 Login error:', error);
    
    // Faster error handling with specific checks
    if (error.code === 'ECONNABORTED') {
      throw new Error("Sign-in timed out. Please check your connection and try again.");
    }
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Sign-in failed. Please try again.");
    }
  }
};

export const validateToken = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/validate-token");
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Not logged in, throw error so React Query knows it failed
      throw new Error("Token invalid");
    }
    // For any other error (network, etc.), also throw
    throw new Error("Token validation failed");
  }
};

// Helper function to clear all auth-related localStorage items
const clearAuthStorage = () => {
  localStorage.removeItem("session_id");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_email");
  localStorage.removeItem("user_name");
  localStorage.removeItem("user_image");
};

export const signOut = async () => {
  // Always clear localStorage first, even before API call
  // This ensures logout works even if backend is unavailable
  clearAuthStorage();

  try {
    const response = await axiosInstance.post("/api/auth/logout");
    return response.data;
  } catch (error) {
    // API call failed (e.g., backend down), but we've already cleared localStorage
    // This is fine - user is logged out locally
    console.log("Logout API call failed, but local storage cleared. User logged out locally.");
    // Don't throw - we want logout to succeed even if API fails
    return { success: true, local: true };
  }
};

// Development utility to clear all browser storage
export const clearAllStorage = () => {
  // Clear localStorage
  localStorage.clear();
  // Clear sessionStorage
  sessionStorage.clear();
  // Clear cookies (by setting them to expire in the past)
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

export const addMyHotel = async (hotelFormData: FormData) => {
  const response = await axiosInstance.post("/api/my-hotels", hotelFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const addMyHotelJson = async (hotelData: any) => {
  console.log('=== ADD HOTEL JSON API CALL ===');
  console.log('Sending data:', JSON.stringify(hotelData, null, 2));
  
  const response = await axiosInstance.post("/api/my-hotels/json", hotelData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  console.log('Response data:', response.data);
  return response.data;
};

export const fetchMyHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/my-hotels");
  return response.data;
};

export const fetchMyHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export const updateMyHotelById = async (hotelFormData: FormData) => {
  const hotelId = hotelFormData.get("hotelId");
  const response = await axiosInstance.put(
    `/api/my-hotels/${hotelId}`,
    hotelFormData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const updateMyHotelByIdJson = async (hotelData: any) => {
  const hotelId = hotelData._id || hotelData.hotelId;
  const response = await axiosInstance.put(
    `/api/my-hotels/${hotelId}/json`,
    hotelData,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
};

export const deleteMyHotelById = async (hotelId: string) => {
  const response = await axiosInstance.delete(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export type SearchParams = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  adultCount?: string;
  childCount?: string;
  page?: string;
  facilities?: string[];
  types?: string[];
  stars?: string[];
  maxPrice?: string;
  sortOption?: string;
};

export const searchHotels = async (
  searchParams: SearchParams
): Promise<HotelSearchResponse> => {
  const queryParams = new URLSearchParams();

  // Only add destination if it's not empty
  if (searchParams.destination && searchParams.destination.trim() !== "") {
    queryParams.append("destination", searchParams.destination.trim());
  }

  queryParams.append("checkIn", searchParams.checkIn || "");
  queryParams.append("checkOut", searchParams.checkOut || "");
  // Only filter by guest count if more than the minimum defaults
  if (searchParams.adultCount && parseInt(searchParams.adultCount) > 1) {
    queryParams.append("adultCount", searchParams.adultCount);
  }
  if (searchParams.childCount && parseInt(searchParams.childCount) > 0) {
    queryParams.append("childCount", searchParams.childCount);
  }
  queryParams.append("page", searchParams.page || "");
  queryParams.append("maxPrice", searchParams.maxPrice || "");
  queryParams.append("sortOption", searchParams.sortOption || "");

  searchParams.facilities?.forEach((facility) =>
    queryParams.append("facilities", facility)
  );

  searchParams.types?.forEach((type) => queryParams.append("types", type));
  searchParams.stars?.forEach((star) => queryParams.append("stars", star));

  const response = await axiosInstance.get(`/api/hotels/search?${queryParams}`);
  return response.data;
};

export const fetchBusinessStats = async (timeRange: string = '30d') => {
  const response = await axiosInstance.get(`/api/admin/business-stats?timeRange=${timeRange}`);
  return response.data;
};

export const fetchHotels = async (): Promise<HotelType[]> => {
  const response = await axiosInstance.get("/api/hotels");
  return response.data;
};

export const fetchHotelById = async (hotelId: string): Promise<HotelType> => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}`);
  return response.data;
};

export const createPaymentIntent = async (
  hotelId: string,
  downPaymentAmount: string,
  numberOfNights: string
): Promise<PaymentIntentResponse> => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/bookings/payment-intent`,
    { downPaymentAmount, numberOfNights }
  );
  return response.data;
};

export const createRoomBooking = async (formData: BookingFormData) => {
  const response = await axiosInstance.post(
    `/api/hotels/${formData.hotelId}/bookings`,
    formData
  );
  return response.data;
};

export const createGCashBooking = async (formData: any) => {
  const formDataToSubmit = new FormData();
  
  // Add all booking fields
  Object.keys(formData).forEach(key => {
    if (key === 'gcashPayment') {
      // Handle GCash payment object separately
      const gcashPayment = formData[key];
      Object.keys(gcashPayment).forEach(gcashKey => {
        if (gcashKey === 'paymentTime') {
          formDataToSubmit.append(`gcashPayment.${gcashKey}`, new Date(gcashPayment[gcashKey]).toISOString());
        } else {
          formDataToSubmit.append(`gcashPayment.${gcashKey}`, gcashPayment[gcashKey]);
        }
      });
    } else if (key === 'screenshotFile') {
      // Add the screenshot file directly - this is the key fix
      if (formData[key] instanceof File) {
        formDataToSubmit.append('gcashPayment.screenshotFile', formData[key]);
      }
    } else if (key === 'paymentTime') {
      formDataToSubmit.append(key, new Date(formData[key]).toISOString());
    } else {
      formDataToSubmit.append(key, formData[key]);
    }
  });

  const response = await axiosInstance.post(
    `/api/hotels/${formData.hotelId}/bookings/gcash`,
    formDataToSubmit,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const fetchMyBookings = async (): Promise<HotelWithBookingsType[]> => {
  const response = await axiosInstance.get("/api/my-bookings");
  return response.data;
};

export const deleteBooking = async (bookingId: string) => {
  const response = await axiosInstance.delete(`/api/my-bookings/${bookingId}`);
  return response.data;
};

export const updateBooking = async (bookingId: string, bookingData: any) => {
  const response = await axiosInstance.put(`/api/my-bookings/${bookingId}`, bookingData);
  return response.data;
};

export const fetchHotelBookings = async (
  hotelId: string
): Promise<BookingType[]> => {
  const response = await axiosInstance.get(`/api/bookings/hotel/${hotelId}`);
  return response.data;
};

export const verifyGCashPayment = async (
  bookingId: string,
  status: "verified" | "rejected",
  reason?: string
) => {
  const response = await axiosInstance.patch(`/api/bookings/${bookingId}/gcash/verify`, {
    status,
    rejectionReason: reason,
  });
  return response.data;
};

// Walk-in booking API functions
export const createWalkInBooking = async (formData: any) => {
  const response = await axiosInstance.post("/api/bookings/walk-in", formData);
  return response.data;
};

export const fetchBookingReceipt = async (
  bookingId: string,
  format: "json" | "html" | "text" = "json"
) => {
  const response = await axiosInstance.get(`/api/bookings/${bookingId}/receipt?format=${format}`);
  return response.data;
};

// Business Insights API functions (public endpoints - no auth required)
export const fetchBusinessInsightsDashboard = async () => {
  const response = await axiosInstance.get("/api/business-insights/dashboard/public");
  return response.data;
};

export const fetchBusinessInsightsForecast = async () => {
  const response = await axiosInstance.get("/api/business-insights/forecast/public");
  return response.data;
};

export const fetchBusinessInsightsPerformance = async () => {
  const response = await axiosInstance.get("/api/business-insights/system-stats/public");
  return response.data;
};

// Resort Approval API functions (Admin only)
export const fetchPendingResorts = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/resort-approval/pending?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchAllResortsForApproval = async (page = 1, limit = 10, status?: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (status) params.append('status', status);
  const response = await axiosInstance.get(`/api/resort-approval/all?${params}`);
  return response.data;
};

export const approveResort = async (resortId: string) => {
  const response = await axiosInstance.post(`/api/resort-approval/${resortId}/approve`);
  return response.data;
};

export const rejectResort = async (resortId: string, rejectionReason: string) => {
  const response = await axiosInstance.post(`/api/resort-approval/${resortId}/reject`, {
    rejectionReason
  });
  return response.data;
};

export const fetchApprovalStats = async () => {
  const response = await axiosInstance.get("/api/resort-approval/stats");
  return response.data;
};

// Admin Management Functions
export const fetchAllUsers = async (): Promise<any[]> => {
  const response = await axiosInstance.get("/api/admin-management/users");
  return response.data;
};

export const searchUsers = async (query: string): Promise<any[]> => {
  const response = await axiosInstance.get(`/api/admin-management/search-users?query=${encodeURIComponent(query)}`);
  return response.data;
};

export const promoteUserToAdmin = async (userId: string): Promise<any> => {
  const response = await axiosInstance.put(`/api/admin-management/promote-to-admin/${userId}`);
  return response.data;
};

export const demoteUserToUser = async (userId: string) => {
  const response = await axiosInstance.put(`/api/admin-management/demote-to-user/${userId}`);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await axiosInstance.delete(`/api/admin-management/delete-user/${userId}`);
  return response.data;
};

export const toggleUserStatus = async (userId: string) => {
  const response = await axiosInstance.put(`/api/admin-management/toggle-user-status/${userId}`);
  return response.data;
};

// Role Promotion Requests (for users applying to become resort owners)
export const fetchPendingRoleRequests = async (): Promise<any[]> => {
  const response = await axiosInstance.get("/api/admin-management/role-requests/pending");
  return response.data;
};

export const approveRoleRequest = async (requestId: string): Promise<any> => {
  const response = await axiosInstance.put(`/api/admin-management/role-requests/${requestId}/approve`);
  return response.data;
};

export const declineRoleRequest = async (requestId: string, reason?: string): Promise<any> => {
  const response = await axiosInstance.put(`/api/admin-management/role-requests/${requestId}/decline`, { reason });
  return response.data;
};

export const fetchExistingResortOwners = async (): Promise<any[]> => {
  const response = await axiosInstance.get("/api/admin-management/resort-owners");
  return response.data;
};

export const demoteResortOwner = async (userId: string): Promise<any> => {
  const response = await axiosInstance.put(`/api/admin-management/demote-resort-owner/${userId}`);
  return response.data;
};

// ==================== ADMIN REPORT MODULE - STRICTLY ADMIN ONLY ====================

// Reservation Reports
// 2.5.1.1 Booking Summary (daily, weekly, monthly, yearly)
export const fetchBookingSummary = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.groupBy) queryParams.append('groupBy', params.groupBy);
  const response = await axiosInstance.get(`/api/resort-reports/reservations/summary?${queryParams}`);
  return response.data;
};

// 2.5.1.2 Occupancy Rate Report
export const fetchOccupancyRate = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  const response = await axiosInstance.get(`/api/resort-reports/reservations/occupancy?${queryParams}`);
  return response.data;
};

// 2.5.1.3 Cancelled Reservation Log
export const fetchCancelledReservations = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  const response = await axiosInstance.get(`/api/resort-reports/reservations/cancelled?${queryParams}`);
  return response.data;
};

// Financial Reports
// 2.5.2.1 Revenue Report per Category (Rooms, Amenities, Activities)
export const fetchRevenueReport = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  const response = await axiosInstance.get(`/api/resort-reports/financial/revenue?${queryParams}`);
  return response.data;
};

// 2.5.2.2 Daily Transaction Summary
export const fetchDailyTransaction = async (params: {
  hotelId?: string;
  date?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.date) queryParams.append('date', params.date);
  const response = await axiosInstance.get(`/api/resort-reports/financial/daily?${queryParams}`);
  return response.data;
};

// 2.5.2.3 Tax Collection Report
export const fetchTaxCollection = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  const response = await axiosInstance.get(`/api/resort-reports/financial/taxes?${queryParams}`);
  return response.data;
};

// Operational Reports
// 2.5.3.1 Guest Master List
export const fetchGuestMasterList = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  const response = await axiosInstance.get(`/api/resort-reports/operational/guests?${queryParams}`);
  return response.data;
};

// 2.5.3.2 Activity Participation Report
export const fetchActivityParticipation = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  const response = await axiosInstance.get(`/api/resort-reports/operational/activities?${queryParams}`);
  return response.data;
};

// 2.5.3.3 Room Maintenance History
export const fetchRoomMaintenanceHistory = async (params: {
  hotelId?: string;
  roomId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.roomId) queryParams.append('roomId', params.roomId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  const response = await axiosInstance.get(`/api/resort-reports/operational/maintenance?${queryParams}`);
  return response.data;
};

// 2.5.4 Amenity Usage Report
export const fetchAmenityUsage = async (params: {
  hotelId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params.hotelId) queryParams.append('hotelId', params.hotelId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  const response = await axiosInstance.get(`/api/resort-reports/amenity-usage?${queryParams}`);
  return response.data;
};

export const createReport = async (reportData: {
  reportedItemId: string;
  reportedItemType: "hotel" | "booking" | "review" | "user";
  reason: string;
  description: string;
  priority?: string;
}) => {
  const response = await axiosInstance.post("/api/reports", reportData);
  return response.data;
};

export const fetchReports = async (page = 1, limit = 10, status?: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (status) params.append('status', status);
  const response = await axiosInstance.get(`/api/reports?${params}`);
  return response.data;
};

export const fetchReportById = async (reportId: string) => {
  const response = await axiosInstance.get(`/api/reports/${reportId}`);
  return response.data;
};

export const updateReport = async (reportId: string, updateData: {
  status?: string;
  adminNotes?: string;
}) => {
  const response = await axiosInstance.put(`/api/reports/${reportId}`, updateData);
  return response.data;
};

export const deleteReport = async (reportId: string) => {
  const response = await axiosInstance.delete(`/api/reports/${reportId}`);
  return response.data;
};

export const fetchMyReports = async (page = 1, limit = 10, status?: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (status) params.append('status', status);
  const response = await axiosInstance.get(`/api/reports/my-reports?${params}`);
  return response.data;
};

// Website Feedback API functions
export const createWebsiteFeedback = async (feedbackData: {
  type: "bug" | "feature" | "issue" | "feedback" | "compliment";
  message: string;
  email?: string;
  pageUrl?: string;
  userAgent?: string;
}) => {
  const response = await axiosInstance.post("/api/website-feedback", feedbackData);
  return response.data;
};

export const fetchWebsiteFeedback = async (page = 1, limit = 10, status?: string, type?: string) => {
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  const response = await axiosInstance.get(`/api/website-feedback?${params}`);
  return response.data;
};

export const fetchWebsiteFeedbackStats = async () => {
  const response = await axiosInstance.get("/api/website-feedback/stats");
  return response.data;
};

export const fetchWebsiteFeedbackById = async (feedbackId: string) => {
  const response = await axiosInstance.get(`/api/website-feedback/${feedbackId}`);
  return response.data;
};

export const updateWebsiteFeedback = async (feedbackId: string, updateData: {
  status?: string;
  adminNotes?: string;
  priority?: string;
  assignedTo?: string;
}) => {
  const response = await axiosInstance.put(`/api/website-feedback/${feedbackId}`, updateData);
  return response.data;
};

export const deleteWebsiteFeedback = async (feedbackId: string) => {
  const response = await axiosInstance.delete(`/api/website-feedback/${feedbackId}`);
  return response.data;
};

// Discount/Promo Code Validation
export interface DiscountValidationResponse {
  success: boolean;
  message?: string;
  data?: {
    code: string;
    name: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    discountCategory: string;
    requiredDocuments: string[];
  };
}

export const validateDiscountCode = async (
  hotelId: string,
  code: string,
  bookingAmount: number
): Promise<DiscountValidationResponse> => {
  try {
    const response = await axiosInstance.post(`/api/pricing/validate-discount`, {
      hotelId,
      code,
      bookingAmount,
      roomTypes: []
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return { success: false, message: "Failed to validate discount code" };
  }
};

// Role Promotion Requests
export const fetchPromotionRequests = async (status?: 'pending' | 'approved' | 'declined') => {
  const response = await axiosInstance.get(`/api/role-promotion-requests?status=${status || 'pending'}`);
  return response.data;
};

export const approvePromotionRequest = async (requestId: string) => {
  const response = await axiosInstance.post(`/api/role-promotion-requests/${requestId}/approve`);
  return response.data;
};

export const declinePromotionRequest = async (requestId: string, reason: string) => {
  const response = await axiosInstance.post(`/api/role-promotion-requests/${requestId}/decline`, { reason });
  return response.data;
};

// Bookings
export const fetchAllBookings = async (filters?: {
  resortId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.resortId) params.append('resortId', filters.resortId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  
  const response = await axiosInstance.get(`/api/bookings/filter?${params.toString()}`);
  return response.data;
};

export const deleteResort = async (resortId: string) => {
  const response = await axiosInstance.delete(`/api/resort-approval/${resortId}`);
  return response.data;
};

export const submitResortOwnerApplication = async (formData: FormData) => {
  try {
    const response = await axiosInstance.post("/api/role-promotion-requests", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Submit resort owner application error:', error.response?.data);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || "Invalid request. Please check your documents and try again.");
    } else if (error.response?.status === 401) {
      throw new Error("You must be logged in to submit an application.");
    } else {
      throw new Error(error.message || "Failed to submit application. Please try again.");
    }
  }
};

// Resort Staff Management API functions
export const getResortStaff = async () => {
  const response = await axiosInstance.get("/api/resort-staff", {
    headers: {
      'X-Skip-Cancellation': 'true'
    }
  });
  return response.data;
};

export const createResortStaff = async (staffData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  resortIds: string[];
  permissions?: any;
}) => {
  const response = await axiosInstance.post("/api/resort-staff", staffData);
  return response.data;
};

export const updateResortStaff = async (staffId: string, staffData: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  permissions?: any;
  isActive?: boolean;
  resortIds?: string[];
}) => {
  const response = await axiosInstance.put(`/api/resort-staff/${staffId}`, staffData);
  return response.data;
};

export const deleteResortStaff = async (staffId: string) => {
  const response = await axiosInstance.delete(`/api/resort-staff/${staffId}`);
  return response.data;
};

export const getAssignedResorts = async () => {
  const response = await axiosInstance.get("/api/resort-staff/assigned-resorts");
  return response.data;
};
