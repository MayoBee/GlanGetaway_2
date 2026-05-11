import React, { useState } from "react";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import * as apiClient from "../api-client";
import { BookingType } from "../../../shared/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../shared/ui/dialog";
import { Badge } from "../../../shared/ui/badge";
// import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader } from "../../../shared/ui/card";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Building2,
  Star,
  CreditCard,
  FileText,
  // X,
  Filter,
} from "lucide-react";

interface BookingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  hotelName: string;
}

const BookingLogModal: React.FC<BookingLogModalProps> = ({
  isOpen,
  onClose,
  hotelId,
  hotelName,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: bookings, isLoading } = useQueryWithLoading(
    "fetchHotelBookings",
    () => apiClient.fetchHotelBookings(hotelId),
    {
      enabled: isOpen && !!hotelId,
      loadingMessage: "Loading booking data...",
    }
  );

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "refunded":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (paymentStatus: string | undefined) => {
    switch (paymentStatus) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getDateCategory = (checkIn: Date) => {
    const today = new Date();
    const checkInDate = new Date(checkIn);
    const diffTime = checkInDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "past";
    } else if (diffDays <= 7) {
      return "upcoming";
    } else {
      return "future";
    }
  };

  const filteredBookings = bookings?.filter((booking: BookingType) => {
    const statusMatch =
      statusFilter === "all" || booking.status === statusFilter;
    const dateMatch =
      dateFilter === "all" || getDateCategory(booking.checkIn) === dateFilter;
    return statusMatch && dateMatch;
  });

  const groupedBookings = filteredBookings?.reduce(
    (groups: any, booking: BookingType) => {
      const category = getDateCategory(booking.checkIn);
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(booking);
      return groups;
    },
    {}
  );

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "upcoming":
        return "Upcoming Bookings (Next 7 Days)";
      case "future":
        return "Future Bookings";
      case "past":
        return "Past Bookings";
      default:
        return "All Bookings";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "upcoming":
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case "future":
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case "past":
        return <Calendar className="w-4 h-4 text-gray-500" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] min-h-[400px] overflow-y-auto bg-white p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-6 h-6 text-primary-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Booking Log - {hotelName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and track all bookings for this hotel
                </p>
              </div>
            </div>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
              <Filter className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-gray-800">Filters</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 hover:border-primary-400 rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-all shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 hover:border-primary-400 rounded-md px-3 py-1.5 pr-8 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer transition-all shadow-sm"
                >
                  <option value="all">All Dates</option>
                  <option value="upcoming">Upcoming (Next 7 Days)</option>
                  <option value="future">Future</option>
                  <option value="past">Past</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Statistics */}
        {bookings && bookings.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-100">
                      Total Bookings
                    </p>
                    <p className="text-2xl font-bold text-white mt-0.5">
                      {bookings.length}
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 border-none shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-100">
                      Confirmed
                    </p>
                    <p className="text-2xl font-bold text-white mt-0.5">
                      {
                        bookings.filter(
                          (b: BookingType) => b.status === "confirmed"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-none shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-100">
                      Total Revenue
                    </p>
                    <p className="text-2xl font-bold text-white mt-0.5">
                      ₱
                      {bookings
                        .filter((b: BookingType) => b.paymentStatus === "paid")
                        .reduce(
                          (sum: number, b: BookingType) =>
                            sum + (b.totalCost || 0),
                          0
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none shadow hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-orange-100">Pending</p>
                    <p className="text-2xl font-bold text-white mt-0.5">
                      {
                        bookings.filter(
                          (b: BookingType) => b.status === "pending"
                        ).length
                      }
                    </p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bookings List Container */}
        <div className="flex-1 flex flex-col">
          {/* Bookings List */}
          <div className="space-y-6 flex-1 min-h-[400px]">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading bookings...</p>
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-full mb-6">
                  <Building2 className="w-20 h-20 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Bookings Found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  This hotel doesn't have any bookings yet.
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 max-w-md border border-blue-200 shadow-sm">
                  <p className="text-sm text-blue-800 font-medium">
                    When guests make bookings for this hotel, they will appear
                    here with all their details, special requests, and payment
                    information.
                  </p>
                </div>
              </div>
            ) : !filteredBookings || filteredBookings.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-6 rounded-full mb-6">
                  <Filter className="w-20 h-20 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Matching Bookings
                </h3>
                <p className="text-gray-600 mb-6 max-w-md">
                  No bookings match your current filter criteria.
                </p>
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 max-w-md border border-amber-200 shadow-sm">
                  <p className="text-sm text-amber-800 font-medium mb-3">
                    Try adjusting your filters:
                  </p>
                  {statusFilter !== "all" && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-amber-700">
                      <span className="font-semibold">• Status:</span>
                      <span>Currently filtering for "{statusFilter}" bookings</span>
                    </div>
                  )}
                  {dateFilter !== "all" && (
                    <div className="flex items-center justify-center space-x-2 text-sm text-amber-700">
                      <span className="font-semibold">• Date:</span>
                      <span>Currently filtering for "{dateFilter}" bookings</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              Object.entries(groupedBookings || {}).map(
                ([category, categoryBookings]: [string, any]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-gray-100 to-blue-100 px-3 py-2 rounded-lg border border-gray-200">
                      {getCategoryIcon(category)}
                      <h3 className="text-sm font-bold text-gray-900">
                        {getCategoryTitle(category)}
                      </h3>
                      <Badge variant="outline" className="ml-2 px-2 py-0.5 text-xs font-semibold bg-white shadow-sm">
                        {categoryBookings.length} booking
                        {categoryBookings.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {categoryBookings.map((booking: BookingType) => (
                        <Card
                          key={booking._id}
                          className="hover:shadow-md transition-all border hover:border-primary-300"
                        >
                          <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-blue-50 border-b px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-lg shadow-sm">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-gray-900">
                                    {booking.firstName} {booking.lastName}
                                  </h4>
                                  <p className="text-xs text-gray-600 font-medium">
                                    #{booking._id.slice(-8).toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={`${getStatusColor(booking.status)} px-2 py-0.5 text-xs font-semibold shadow-sm`}
                                >
                                  {booking.status}
                                </Badge>
                                <Badge
                                  className={`${getPaymentStatusColor(
                                    booking.paymentStatus
                                  )} px-2 py-0.5 text-xs font-semibold shadow-sm`}
                                >
                                  {booking.paymentStatus}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-4 px-4 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              {/* Guest Information */}
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center">
                                  <Users className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                  Guest Details
                                </h5>
                                <div className="space-y-2">
                                  <div className="flex items-start space-x-1.5">
                                    <Mail className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs text-gray-700 break-all">
                                      {booking.email}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-xs text-gray-700">
                                      {booking.phone || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <Users className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-xs text-gray-700">
                                      {booking.adultCount} adults,{" "}
                                      {booking.childCount} children
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Stay Information */}
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center">
                                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                  Stay Details
                                </h5>
                                <div className="space-y-2">
                                  <div className="flex items-start space-x-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="text-xs text-gray-700 block">
                                        Check-in:{" "}
                                        {new Date(
                                          booking.checkIn
                                        ).toLocaleDateString()}
                                      </span>
                                      {booking.checkInTime && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          at {booking.checkInTime}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-start space-x-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <span className="text-xs text-gray-700 block">
                                        Check-out:{" "}
                                        {new Date(
                                          booking.checkOut
                                        ).toLocaleDateString()}
                                      </span>
                                      {booking.checkOutTime && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          at {booking.checkOutTime}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-xs text-gray-700">
                                      Booked:{" "}
                                      {booking.createdAt
                                        ? new Date(
                                            booking.createdAt
                                          ).toLocaleDateString()
                                        : "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Financial Information */}
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <h5 className="text-xs font-bold text-gray-800 mb-2 flex items-center">
                                  <CreditCard className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                                  Payment Details
                                </h5>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-xs font-bold text-gray-900">
                                      Total: ₱
                                      {booking.totalCost?.toLocaleString()}
                                    </span>
                                  </div>
                                  {booking.refundAmount !== undefined &&
                                    booking.refundAmount > 0 && (
                                      <div className="flex items-center space-x-1.5">
                                        <CreditCard className="w-3.5 h-3.5 text-red-500" />
                                        <span className="text-xs text-red-700 font-medium">
                                          Refunded: ₱
                                          {booking.refundAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>

                            {/* Special Requests */}
                            {booking.specialRequests && (
                              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                <div className="flex items-start space-x-2">
                                  <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-bold text-blue-900 mb-0.5">
                                      Special Requests:
                                    </p>
                                    <p className="text-xs text-blue-800">
                                      {booking.specialRequests}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-3 border-t">
                              {booking.status === "pending" && (
                                <>
                                  <button className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-md hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow">
                                    Confirm
                                  </button>
                                  <button className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold rounded-md hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow">
                                    Cancel
                                  </button>
                                </>
                              )}
                              <button className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-md hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow">
                                View Details
                              </button>
                              <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-50 transition-all">
                                Message
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-all"
          >
            Close Window
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingLogModal;
