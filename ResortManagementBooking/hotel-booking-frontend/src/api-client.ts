import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    // Check for both 'token' and 'session_id' to handle different auth implementations
    const token = localStorage.getItem('token') || localStorage.getItem('session_id');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('session_id');
      localStorage.removeItem('is_super_admin');
      window.location.href = '/admin-login';
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const signIn = async (formData: any) => {
  const response = await axiosInstance.post("/api/auth/sign-in", formData);
  return response.data;
};

export const signOut = async () => {
  const response = await axiosInstance.post("/api/auth/sign-out");
  return response.data;
};

export const validateToken = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/validate-token");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/api/auth/me");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getApiBaseUrl = () => API_BASE_URL;

// Hotel Management
export const fetchMyHotels = async () => {
  const response = await axiosInstance.get("/api/my-hotels");
  return response.data;
};

export const fetchMyHotelById = async (hotelId: string) => {
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

export const deleteMyHotelById = async (hotelId: string) => {
  const response = await axiosInstance.delete(`/api/my-hotels/${hotelId}`);
  return response.data;
};

export const addMyHotel = async (hotelFormData: FormData) => {
  const response = await axiosInstance.post("/api/my-hotels", hotelFormData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Search
export const searchHotels = async (searchParams: any) => {
  const queryParams = new URLSearchParams();
  if (searchParams.destination && searchParams.destination.trim() !== "") {
    queryParams.append("destination", searchParams.destination.trim());
  }
  queryParams.append("checkIn", searchParams.checkIn || "");
  queryParams.append("checkOut", searchParams.checkOut || "");
  if (searchParams.adultCount && parseInt(searchParams.adultCount) > 1) {
    queryParams.append("adultCount", searchParams.adultCount);
  }
  if (searchParams.childCount && parseInt(searchParams.childCount) > 0) {
    queryParams.append("childCount", searchParams.childCount);
  }
  queryParams.append("page", searchParams.page || "");
  queryParams.append("maxPrice", searchParams.maxPrice || "");
  queryParams.append("sortOption", searchParams.sortOption || "");
  searchParams.facilities?.forEach((facility: string) =>
    queryParams.append("facilities", facility)
  );
  searchParams.types?.forEach((type: string) => queryParams.append("types", type));
  searchParams.stars?.forEach((star: string) => queryParams.append("stars", star));
  const response = await axiosInstance.get(`/api/hotels/search?${queryParams}`);
  return response.data;
};

// Hotels
export const fetchHotels = async () => {
  const response = await axiosInstance.get("/api/hotels");
  return response.data.map((hotel: any) => ({
    ...hotel,
    imageUrls: hotel.imageUrls || (hotel.image ? [hotel.image] : []),
    starRating: hotel.starRating || hotel.rating || 0,
    type: Array.isArray(hotel.type) ? hotel.type : (typeof hotel.type === 'string' ? [hotel.type] : [])
  }));
};

export const fetchHotelById = async (hotelId: string) => {
  const response = await axiosInstance.get(`/api/hotels/${hotelId}`);
  return response.data;
};

export const checkAvailability = async (params: {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  selectedRooms?: Array<{ id: string; units: number }>;
  selectedCottages?: Array<{ id: string; units: number }>;
  selectedAmenities?: Array<{ id: string; units: number }>;
  selectedPackages?: Array<{ id: string }>;
}) => {
  const { hotelId, checkIn, checkOut, selectedRooms, selectedCottages, selectedAmenities, selectedPackages } = params;
  const queryParams = new URLSearchParams();
  queryParams.append('checkIn', checkIn);
  queryParams.append('checkOut', checkOut);
  
  if (selectedRooms && selectedRooms.length > 0) {
    queryParams.append('roomIds', selectedRooms.map(r => r.id).join(','));
  }
  if (selectedCottages && selectedCottages.length > 0) {
    queryParams.append('cottageIds', selectedCottages.map(c => c.id).join(','));
  }
  
  const response = await axiosInstance.get(`/api/hotels/${hotelId}/availability?${queryParams}`);
  return response.data;
};

// Bookings
export const fetchMyBookings = async () => {
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

export const createRoomBooking = async (bookingData: any) => {
  const { hotelId, ...data } = bookingData;
  const response = await axiosInstance.post(`/api/hotels/${hotelId}/bookings`, data);
  return response.data;
};

export const createGCashBooking = async (bookingData: any) => {
  const { hotelId, ...data } = bookingData;
  const response = await axiosInstance.post(`/api/hotels/${hotelId}/bookings/gcash`, data);
  return response.data;
};

export const createPaymentIntent = async (hotelId: string, downPaymentAmount: string, numberOfNights: string) => {
  const response = await axiosInstance.post(
    `/api/hotels/${hotelId}/bookings/payment-intent`,
    { downPaymentAmount, numberOfNights }
  );
  return response.data;
};

// Register
export const register = async (formData: any) => {
  const response = await axiosInstance.post("/api/users/register", formData);
  return response.data;
};

// Business Stats
export const fetchBusinessStats = async (timeRange: string = '30d') => {
  const response = await axiosInstance.get(`/api/admin/business-stats?timeRange=${timeRange}`);
  return response.data;
};

// Business Insights
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

// Admin Management
export const fetchAllUsers = async () => {
  const response = await axiosInstance.get("/api/admin-management/users");
  return response.data;
};

export const searchUsers = async (query: string) => {
  const response = await axiosInstance.get(`/api/admin-management/users/search?q=${query}`);
  return response.data;
};

export const promoteUserToAdmin = async (userId: string) => {
  const response = await axiosInstance.put(`/api/admin-management/users/${userId}/promote`);
  return response.data;
};

export const demoteUserToUser = async (userId: string) => {
  const response = await axiosInstance.put(`/api/admin-management/users/${userId}/demote`);
  return response.data;
};

export const deleteUser = async (userId: string) => {
  const response = await axiosInstance.delete(`/api/admin-management/users/${userId}`);
  return response.data;
};

export const toggleUserStatus = async (userId: string) => {
  const response = await axiosInstance.put(`/api/admin-management/users/${userId}/toggle-status`);
  return response.data;
};

// Resort Approval
export const fetchPendingResorts = async (page: number = 1, limit: number = 10, signal?: AbortSignal) => {
  const response = await axiosInstance.get(`/api/resort-approval/pending?page=${page}&limit=${limit}`, { signal });
  return response.data;
};

export const fetchAllResortsForApproval = async (page: number = 1, limit: number = 10, status?: string, signal?: AbortSignal) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);
  const response = await axiosInstance.get(`/api/resort-approval/all?${params}`, { signal });
  return response.data;
};

export const fetchApprovalStats = async (signal?: AbortSignal) => {
  const response = await axiosInstance.get("/api/resort-approval/stats", { signal });
  return response.data;
};

export const approveResort = async (resortId: string) => {
  const response = await axiosInstance.post(`/api/resort-approval/${resortId}/approve`);
  return response.data;
};

export const rejectResort = async (resortId: string, reason: string) => {
  const response = await axiosInstance.post(`/api/resort-approval/${resortId}/reject`, { rejectionReason: reason });
  return response.data;
};

// Reports
export const fetchReports = async (page: number = 1, limit: number = 50, type?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (type) params.append('type', type);
  const response = await axiosInstance.get(`/api/reports?${params}`);
  return response.data;
};

export const updateReport = async (reportId: string, data: { status?: string; adminNotes?: string }) => {
  const response = await axiosInstance.put(`/api/reports/${reportId}`, data);
  return response.data;
};

// Development utility to clear all browser storage
export const clearAllStorage = () => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

// Website Feedback API functions
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

// Admin Report API functions
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

// Staff Management API functions
export const fetchStaffMembers = async (hotelId?: string) => {
  const params = hotelId ? `?hotelId=${hotelId}` : '';
  const response = await axiosInstance.get(`/api/staff-management${params}`);
  return response.data;
};

export const createStaffMember = async (staffData: any) => {
  const response = await axiosInstance.post('/api/staff-management', staffData);
  return response.data;
};

export const updateStaffMember = async (staffId: string, staffData: any) => {
  const response = await axiosInstance.put(`/api/staff-management/${staffId}`, staffData);
  return response.data;
};

export const deleteStaffMember = async (staffId: string) => {
  const response = await axiosInstance.delete(`/api/staff-management/${staffId}`);
  return response.data;
};

export const toggleStaffStatus = async (staffId: string) => {
  const response = await axiosInstance.put(`/api/staff-management/${staffId}/toggle-status`);
  return response.data;
};

// Housekeeping Tasks API functions
export const fetchHousekeepingTasks = async (hotelId?: string, status?: string) => {
  const params = new URLSearchParams();
  if (hotelId) params.append('hotelId', hotelId);
  if (status) params.append('status', status);
  const response = await axiosInstance.get(`/api/housekeeping-tasks?${params}`);
  return response.data;
};

export const createHousekeepingTask = async (taskData: any) => {
  const response = await axiosInstance.post('/api/housekeeping-tasks', taskData);
  return response.data;
};

export const updateHousekeepingTask = async (taskId: string, taskData: any) => {
  const response = await axiosInstance.put(`/api/housekeeping-tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteHousekeepingTask = async (taskId: string) => {
  const response = await axiosInstance.delete(`/api/housekeeping-tasks/${taskId}`);
  return response.data;
};

export const assignHousekeepingTask = async (taskId: string, staffId: string) => {
  const response = await axiosInstance.put(`/api/housekeeping-tasks/${taskId}/assign`, { staffId });
  return response.data;
};

// Maintenance API functions
export const fetchMaintenanceRequests = async (hotelId?: string, status?: string) => {
  const params = new URLSearchParams();
  if (hotelId) params.append('hotelId', hotelId);
  if (status) params.append('status', status);
  const response = await axiosInstance.get(`/api/housekeeping-maintenance?${params}`);
  return response.data;
};

export const createMaintenanceRequest = async (maintenanceData: any) => {
  const response = await axiosInstance.post('/api/housekeeping-maintenance', maintenanceData);
  return response.data;
};

export const updateMaintenanceRequest = async (requestId: string, maintenanceData: any) => {
  const response = await axiosInstance.put(`/api/housekeeping-maintenance/${requestId}`, maintenanceData);
  return response.data;
};

export const deleteMaintenanceRequest = async (requestId: string) => {
  const response = await axiosInstance.delete(`/api/housekeeping-maintenance/${requestId}`);
  return response.data;
};

export const assignMaintenanceRequest = async (requestId: string, staffId: string) => {
  const response = await axiosInstance.put(`/api/housekeeping-maintenance/${requestId}/assign`, { staffId });
  return response.data;
};

// Weather Triggers API functions
export const fetchWeatherTriggers = async (hotelId?: string) => {
  const params = hotelId ? `?hotelId=${hotelId}` : '';
  const response = await axiosInstance.get(`/api/weather-triggers${params}`);
  return response.data;
};

export const createWeatherTrigger = async (triggerData: any) => {
  const response = await axiosInstance.post('/api/weather-triggers', triggerData);
  return response.data;
};

export const updateWeatherTrigger = async (triggerId: string, triggerData: any) => {
  const response = await axiosInstance.put(`/api/weather-triggers/${triggerId}`, triggerData);
  return response.data;
};

export const deleteWeatherTrigger = async (triggerId: string) => {
  const response = await axiosInstance.delete(`/api/weather-triggers/${triggerId}`);
  return response.data;
};

export const toggleWeatherTrigger = async (triggerId: string) => {
  const response = await axiosInstance.put(`/api/weather-triggers/${triggerId}/toggle`);
  return response.data;
};

// Feature Flags API functions
export const fetchFeatureFlags = async () => {
  const response = await axiosInstance.get('/api/feature-flags');
  return response.data;
};

export const createFeatureFlag = async (flagData: any) => {
  const response = await axiosInstance.post('/api/feature-flags', flagData);
  return response.data;
};

export const updateFeatureFlag = async (flagId: string, flagData: any) => {
  const response = await axiosInstance.put(`/api/feature-flags/${flagId}`, flagData);
  return response.data;
};

export const deleteFeatureFlag = async (flagId: string) => {
  const response = await axiosInstance.delete(`/api/feature-flags/${flagId}`);
  return response.data;
};

export const toggleFeatureFlag = async (flagId: string) => {
  const response = await axiosInstance.put(`/api/feature-flags/${flagId}/toggle`);
  return response.data;
};

// Room Blocks API functions
export const fetchRoomBlocks = async (hotelId?: string, roomId?: string) => {
  const params = new URLSearchParams();
  if (hotelId) params.append('hotelId', hotelId);
  if (roomId) params.append('roomId', roomId);
  const response = await axiosInstance.get(`/api/room-blocks?${params}`);
  return response.data;
};

export const createRoomBlock = async (blockData: any) => {
  const response = await axiosInstance.post('/api/room-blocks', blockData);
  return response.data;
};

export const updateRoomBlock = async (blockId: string, blockData: any) => {
  const response = await axiosInstance.put(`/api/room-blocks/${blockId}`, blockData);
  return response.data;
};

export const deleteRoomBlock = async (blockId: string) => {
  const response = await axiosInstance.delete(`/api/room-blocks/${blockId}`);
  return response.data;
};

// Identity Verification API functions
export const fetchIdentityVerifications = async (status?: string, type?: string) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  const response = await axiosInstance.get(`/api/identity-verification?${params}`);
  return response.data;
};

export const verifyPWD = async (userId: string, verificationData: any) => {
  const response = await axiosInstance.put(`/api/identity-verification/pwd/${userId}/verify`, verificationData);
  return response.data;
};

export const verifyAccount = async (userId: string, verificationData: any) => {
  const response = await axiosInstance.put(`/api/identity-verification/account/${userId}/verify`, verificationData);
  return response.data;
};

export const fetchVerificationDocuments = async (userId?: string) => {
  const params = userId ? `?userId=${userId}` : '';
  const response = await axiosInstance.get(`/api/verification-documents${params}`);
  return response.data;
};

export const uploadVerificationDocument = async (documentData: FormData) => {
  const response = await axiosInstance.post('/api/verification-documents', documentData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const reviewVerificationDocument = async (documentId: string, reviewData: any) => {
  const response = await axiosInstance.put(`/api/verification-documents/${documentId}/review`, reviewData);
  return response.data;
};

// Amenity Slots API functions
export const fetchAmenitySlots = async (amenityId: string, date?: string) => {
  const params = date ? `?date=${date}` : '';
  const response = await axiosInstance.get(`/api/amenity-slots/amenity/${amenityId}${params}`);
  return response.data;
};

export const bookAmenitySlot = async (slotData: any) => {
  const response = await axiosInstance.post('/api/amenity-slots/book', slotData);
  return response.data;
};

export const cancelAmenitySlotBooking = async (bookingId: string) => {
  const response = await axiosInstance.delete(`/api/amenity-slots/booking/${bookingId}`);
  return response.data;
};

export const fetchMyAmenityBookings = async () => {
  const response = await axiosInstance.get('/api/amenity-slots/my-bookings');
  return response.data;
};

// Walk-in booking API functions
export const createWalkInBooking = async (formData: any) => {
  const response = await axiosInstance.post("/api/bookings/walk-in", formData);
  return response.data;
};

// Resort Staff Management API functions
export const createResortStaff = async (staffData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  resortIds: string[];
  permissions: any;
}) => {
  const response = await axiosInstance.post("/api/resort-staff", staffData);
  return response.data;
};

export const updateResortStaff = async (staffId: string, staffData: {
  firstName?: string;
  lastName?: string;
  resortIds?: string[];
  permissions?: any;
}) => {
  const response = await axiosInstance.put(`/api/resort-staff/${staffId}`, staffData);
  return response.data;
};

export const fetchResortStaff = async () => {
  const response = await axiosInstance.get("/api/resort-staff");
  return response.data;
};

export const deleteResortStaff = async (staffId: string) => {
  const response = await axiosInstance.delete(`/api/resort-staff/${staffId}`);
  return response.data;
};

export const toggleResortStaffStatus = async (staffId: string) => {
  const response = await axiosInstance.patch(`/api/resort-staff/${staffId}/toggle-status`);
  return response.data;
};

