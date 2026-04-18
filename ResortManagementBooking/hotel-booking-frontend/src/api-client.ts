import { axiosInstance } from '@glan-getaway/shared-auth';

// Re-export auth functions
export { signIn, signOut, validateToken, fetchCurrentUser } from '@glan-getaway/shared-auth';

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
