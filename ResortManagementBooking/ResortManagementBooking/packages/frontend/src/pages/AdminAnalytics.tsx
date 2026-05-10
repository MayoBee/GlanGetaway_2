import React, { useState } from "react";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { 
  FileText, 
  BarChart3, 
  Users, 
  DollarSign, 
  Calendar, 
  Building2,
  TrendingUp,
  Activity,
  Wrench,
  Coffee,
  ShieldOff,
  Loader2
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { Input } from "../../../shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";

const AdminAnalytics: React.FC = () => {
  const { showToast } = useAppContext();
  const { isAdmin } = useRoleBasedAccess();
  
  const [activeTab, setActiveTab] = useState("reservations");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0]
  });
  const [groupBy, setGroupBy] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  // Check if user has access
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Only Super Admins can access the Analytics Reports module.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // ==================== RESERVATION REPORTS ====================
  
  // 2.5.1.1 Booking Summary
  const { data: bookingSummary, isLoading: loadingSummary } = useQueryWithLoading(
    ["bookingSummary", dateRange, groupBy],
    () => apiClient.fetchBookingSummary({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      groupBy
    }),
    { 
      enabled: activeTab === "reservations",
      loadingMessage: "Loading booking summary...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // 2.5.1.2 Occupancy Rate
  const { data: occupancyRate, isLoading: loadingOccupancy } = useQueryWithLoading(
    ["occupancyRate", dateRange],
    () => apiClient.fetchOccupancyRate({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "reservations",
      loadingMessage: "Loading occupancy data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // 2.5.1.3 Cancelled Reservations
  const { data: cancelledReservations, isLoading: loadingCancelled } = useQueryWithLoading(
    ["cancelledReservations", dateRange],
    () => apiClient.fetchCancelledReservations({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "reservations",
      loadingMessage: "Loading cancelled reservations...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // ==================== FINANCIAL REPORTS ====================

  // 2.5.2.1 Revenue Report
  const { data: revenueReport, isLoading: loadingRevenue } = useQueryWithLoading(
    ["revenueReport", dateRange],
    () => apiClient.fetchRevenueReport({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "financial",
      loadingMessage: "Loading revenue data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // 2.5.2.2 Daily Transaction
  const { data: dailyTransaction } = useQueryWithLoading(
    ["dailyTransaction"],
    () => apiClient.fetchDailyTransaction({}),
    { 
      enabled: activeTab === "financial",
      loadingMessage: "Loading daily transactions...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // 2.5.2.3 Tax Collection
  const { data: taxCollection, isLoading: loadingTax } = useQueryWithLoading(
    ["taxCollection", dateRange],
    () => apiClient.fetchTaxCollection({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "financial",
      loadingMessage: "Loading tax data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // ==================== OPERATIONAL REPORTS ====================

  // 2.5.3.1 Guest Master List
  const { data: guestList, isLoading: loadingGuests } = useQueryWithLoading(
    ["guestList", dateRange],
    () => apiClient.fetchGuestMasterList({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "operational",
      loadingMessage: "Loading guest data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // 2.5.3.2 Activity Participation
  const { data: activityParticipation, isLoading: loadingActivities } = useQueryWithLoading(
    ["activityParticipation", dateRange],
    () => apiClient.fetchActivityParticipation({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "operational",
      loadingMessage: "Loading activity data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // 2.5.3.3 Room Maintenance
  const { data: maintenanceHistory, isLoading: loadingMaintenance } = useQueryWithLoading(
    ["maintenanceHistory", dateRange],
    () => apiClient.fetchRoomMaintenanceHistory({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "operational",
      loadingMessage: "Loading maintenance data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  // ==================== AMENITY USAGE ====================

  // 2.5.4 Amenity Usage
  const { data: amenityUsage, isLoading: loadingAmenity } = useQueryWithLoading(
    ["amenityUsage", dateRange],
    () => apiClient.fetchAmenityUsage({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }),
    { 
      enabled: activeTab === "amenities",
      loadingMessage: "Loading amenity data...",
      onError: (error: Error) => showToast({ title: "Error", description: error.message, type: "ERROR" })
    }
  );

  const isLoading = loadingSummary || loadingOccupancy || loadingCancelled || 
                    loadingRevenue || loadingTax || loadingGuests || 
                    loadingActivities || loadingMaintenance || loadingAmenity;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { 
      style: 'currency', 
      currency: 'PHP' 
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: "reservations", label: "Reservation Reports", icon: Calendar },
    { id: "financial", label: "Financial Reports", icon: DollarSign },
    { id: "operational", label: "Operational Reports", icon: Building2 },
    { id: "amenities", label: "Amenity Usage", icon: Coffee },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
              Admin Analytics Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive business reports - Strictly for ADMIN only
            </p>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            <ShieldOff className="w-3 h-3 mr-1" />
            ADMIN ONLY
          </Badge>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-40"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-40"
            />
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500">Group by:</span>
              <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2"
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Loading reports...</span>
        </div>
      )}

      {/* ==================== RESERVATION REPORTS ==================== */}
      {!isLoading && activeTab === "reservations" && (
        <div className="space-y-6">
          {/* 2.5.1.1 Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                2.5.1.1 Booking Summary
              </CardTitle>
              <CardDescription>
                Overview of bookings grouped by {groupBy}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookingSummary?.data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Total Bookings</div>
                    <div className="text-2xl font-bold text-blue-900">{bookingSummary.data.total}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Total Revenue</div>
                    <div className="text-2xl font-bold text-green-900">{formatCurrency(bookingSummary.data.revenue)}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600">Cancelled</div>
                    <div className="text-2xl font-bold text-red-900">{bookingSummary.data.cancelled}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5.1.2 Occupancy Rate Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                2.5.1.2 Occupancy Rate Report
              </CardTitle>
              <CardDescription>
                Room occupancy statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {occupancyRate?.data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600">Total Rooms</div>
                    <div className="text-2xl font-bold text-purple-900">{occupancyRate.data.totalRooms}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Occupied Nights</div>
                    <div className="text-2xl font-bold text-blue-900">{occupancyRate.data.occupiedRoomNights}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Available Nights</div>
                    <div className="text-2xl font-bold text-gray-900">{occupancyRate.data.availableRoomNights}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Occupancy Rate</div>
                    <div className="text-2xl font-bold text-green-900">{occupancyRate.data.occupancyRate}%</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5.1.3 Cancelled Reservation Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                2.5.1.3 Cancelled Reservation Log
              </CardTitle>
              <CardDescription>
                List of cancelled bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cancelledReservations?.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Guest</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Check-in</th>
                        <th className="text-left py-2">Check-out</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-left py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cancelledReservations.data.slice(0, 10).map((booking: any) => (
                        <tr key={booking._id} className="border-b">
                          <td className="py-2">{booking.firstName} {booking.lastName}</td>
                          <td className="py-2">{booking.email}</td>
                          <td className="py-2">{formatDate(booking.checkIn)}</td>
                          <td className="py-2">{formatDate(booking.checkOut)}</td>
                          <td className="py-2 text-right">{formatCurrency(booking.totalCost)}</td>
                          <td className="py-2">{booking.cancellationReason || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cancelledReservations.pagination.total > 10 && (
                    <div className="text-center mt-2 text-gray-500">
                      Showing 10 of {cancelledReservations.pagination.total} cancelled reservations
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No cancelled reservations found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== FINANCIAL REPORTS ==================== */}
      {!isLoading && activeTab === "financial" && (
        <div className="space-y-6">
          {/* 2.5.2.1 Revenue Report per Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                2.5.2.1 Revenue Report per Category
              </CardTitle>
              <CardDescription>
                Revenue breakdown by category (Rooms, Amenities)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueReport?.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Total Revenue</h4>
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(revenueReport.data.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {revenueReport.data.totalBookings} bookings
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">By Category</h4>
                    <div className="space-y-2">
                      {revenueReport.data.byCategory.rooms.map((room: any) => (
                        <div key={room._id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{room._id || 'Rooms'}</span>
                          <span className="font-medium">{formatCurrency(room.revenue)}</span>
                        </div>
                      ))}
                      {revenueReport.data.byCategory.amenities.map((amenity: any) => (
                        <div key={amenity._id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>{amenity._id || 'Amenities'}</span>
                          <span className="font-medium">{formatCurrency(amenity.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5.2.2 Daily Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                2.5.2.2 Daily Transaction Summary
              </CardTitle>
              <CardDescription>
                Today's transaction breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyTransaction?.data && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">By Payment Status</h4>
                    <div className="space-y-2">
                      {dailyTransaction.data.transactions.map((t: any) => (
                        <div key={t._id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{t._id || 'N/A'}</span>
                          <span>{t.count} ({formatCurrency(t.total)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">By Payment Method</h4>
                    <div className="space-y-2">
                      {dailyTransaction.data.byPaymentMethod.map((t: any) => (
                        <div key={t._id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{t._id || 'N/A'}</span>
                          <span>{t.count} ({formatCurrency(t.total)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">By Booking Status</h4>
                    <div className="space-y-2">
                      {dailyTransaction.data.byStatus.map((t: any) => (
                        <div key={t._id} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="capitalize">{t._id || 'N/A'}</span>
                          <span>{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5.2.3 Tax Collection Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                2.5.2.3 Tax Collection Report
              </CardTitle>
              <CardDescription>
                VAT/Tax collection summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taxCollection?.data && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Total Sales</div>
                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(taxCollection.data.totalSales)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Base Amount</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(taxCollection.data.baseAmount)}</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm text-yellow-600">Tax Rate</div>
                    <div className="text-2xl font-bold text-yellow-900">{(taxCollection.data.taxRate * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Tax Collected</div>
                    <div className="text-2xl font-bold text-green-900">{formatCurrency(taxCollection.data.taxCollected)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== OPERATIONAL REPORTS ==================== */}
      {!isLoading && activeTab === "operational" && (
        <div className="space-y-6">
          {/* 2.5.3.1 Guest Master List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                2.5.3.1 Guest Master List
              </CardTitle>
              <CardDescription>
                List of all guests with confirmed/completed bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {guestList?.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Guest Name</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Phone</th>
                        <th className="text-center py-2">Adults</th>
                        <th className="text-center py-2">Children</th>
                        <th className="text-left py-2">Check-in</th>
                        <th className="text-left py-2">Check-out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guestList.data.slice(0, 10).map((guest: any) => (
                        <tr key={guest._id} className="border-b">
                          <td className="py-2">{guest.firstName} {guest.lastName}</td>
                          <td className="py-2">{guest.email}</td>
                          <td className="py-2">{guest.phone || 'N/A'}</td>
                          <td className="py-2 text-center">{guest.adultCount}</td>
                          <td className="py-2 text-center">{guest.childCount}</td>
                          <td className="py-2">{formatDate(guest.checkIn)}</td>
                          <td className="py-2">{formatDate(guest.checkOut)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {guestList.pagination.total > 10 && (
                    <div className="text-center mt-2 text-gray-500">
                      Showing 10 of {guestList.pagination.total} guests
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No guest data found
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5.3.2 Activity Participation Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                2.5.3.2 Activity Participation Report
              </CardTitle>
              <CardDescription>
                Activity booking and participation statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityParticipation?.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Activity</th>
                        <th className="text-center py-2">Total Participants</th>
                        <th className="text-center py-2">Adults</th>
                        <th className="text-center py-2">Children</th>
                        <th className="text-center py-2">Bookings</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityParticipation.data.map((activity: any) => (
                        <tr key={activity._id} className="border-b">
                          <td className="py-2">{activity.activityName || 'Unknown Activity'}</td>
                          <td className="py-2 text-center">{activity.totalParticipants}</td>
                          <td className="py-2 text-center">{activity.totalAdults}</td>
                          <td className="py-2 text-center">{activity.totalChildren}</td>
                          <td className="py-2 text-center">{activity.bookings}</td>
                          <td className="py-2 text-right">{formatCurrency(activity.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No activity participation data found
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2.5.3.3 Room Maintenance History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                2.5.3.3 Room Maintenance History
              </CardTitle>
              <CardDescription>
                Room maintenance and repair records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceHistory?.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Room</th>
                        <th className="text-left py-2">Category</th>
                        <th className="text-left py-2">Description</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-right py-2">Cost</th>
                        <th className="text-left py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {maintenanceHistory.data.slice(0, 10).map((m: any) => (
                        <tr key={m._id} className="border-b">
                          <td className="py-2">{m.roomId || 'N/A'}</td>
                          <td className="py-2">{m.category || 'N/A'}</td>
                          <td className="py-2">{m.description || 'N/A'}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={m.status === 'completed' ? 'bg-green-50' : 'bg-yellow-50'}>
                              {m.status || 'N/A'}
                            </Badge>
                          </td>
                          <td className="py-2 text-right">{formatCurrency(m.actualCost || 0)}</td>
                          <td className="py-2">{m.createdAt ? formatDate(m.createdAt) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No maintenance records found
                </div>
              )}
              {maintenanceHistory?.stats && maintenanceHistory.stats.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold mb-2">Summary by Category</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {maintenanceHistory.stats.map((stat: any) => (
                      <div key={stat._id} className="p-2 bg-gray-50 rounded">
                        <div className="text-sm">{stat._id}</div>
                        <div className="font-medium">{stat.count} requests</div>
                        <div className="text-sm text-gray-500">{formatCurrency(stat.totalCost)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== AMENITY USAGE ==================== */}
      {!isLoading && activeTab === "amenities" && (
        <div className="space-y-6">
          {/* 2.5.4 Amenity Usage Report */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                2.5.4 Amenity Usage Report
              </CardTitle>
              <CardDescription>
                Amenity booking and usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {amenityUsage?.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Amenity</th>
                        <th className="text-center py-2">Total Bookings</th>
                        <th className="text-center py-2">Total Guests</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amenityUsage.data.map((amenity: any) => (
                        <tr key={amenity._id} className="border-b">
                          <td className="py-2">{amenity.amenityName || 'Unknown Amenity'}</td>
                          <td className="py-2 text-center">{amenity.totalBookings}</td>
                          <td className="py-2 text-center">{amenity.totalGuests}</td>
                          <td className="py-2 text-right">{formatCurrency(amenity.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No amenity usage data found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
