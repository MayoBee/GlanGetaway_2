import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import { axiosInstance } from "../api-client";
import { fetchMyBookings, deleteBooking } from "../api-client";
import type { BookingType, HotelWithBookingsType } from "@shared/types";
import { Badge } from "../components/ui/badge";
import SmartImage from "../components/SmartImage";
import { Button } from "../components/ui/button";
import PaymentVerificationCard from "../components/PaymentVerificationCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  CreditCard,
  Clock,
  MapPin,
  Phone,
  Star,
  Building,
  TrendingUp,
  Package,
  DollarSign,
  LogIn,
  UserCircle,
  Trash,
  Edit,
} from "lucide-react";
import useAppContext from "../hooks/useAppContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MyBookings = () => {
  const { isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const { data: hotels, refetch: refetchBookings } = useQueryWithLoading<HotelWithBookingsType[]>(
    "fetchMyBookings",
    fetchMyBookings,
    {
      loadingMessage: "Loading your bookings...",
      enabled: isLoggedIn,
    },
  );

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary-100">
                <Calendar className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-xl">My Bookings</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your hotel reservations and booking details
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To view your bookings, please sign in with your test credentials
              or your personal account.
            </p>
            <div className="flex flex-col gap-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-primary-600" />
                <span>Test credentials: test@user.com / 12345678</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary-600" />
                <span>Or use your own registered account</span>
              </div>
            </div>
            <Link to="/sign-in">
              <Button className="w-full font-bold bg-primary-600 hover:bg-primary-700 mt-4">
                <LogIn className="h-4 w-4 mr-2 text-white" />
                Sign In to View Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hotels || hotels.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-500">You haven't made any bookings yet.</p>
        </div>
      </div>
    );
  }

  // Calculate booking statistics
  const totalBookings = hotels.reduce(
    (total, hotel) => total + hotel.bookings.length,
    0,
  );

  // Count unique hotels by hotel ID
  const uniqueHotelIds = new Set(hotels.map((hotel) => hotel._id));
  const differentHotels = uniqueHotelIds.size;

  // Calculate total spent across all bookings using actual booking totalCost
  const totalSpent = hotels.reduce((total, hotel) => {
    return (
      total +
      hotel.bookings.reduce((hotelTotal, booking) => {
        return hotelTotal + (booking.totalCost || 0);
      }, 0)
    );
  }, 0);

  const getStatusColor = (status: string) => {
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
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "refunded":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <TrendingUp className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <Building className="w-4 h-4" />;
      case "completed":
        return <Star className="w-4 h-4" />;
      case "refunded":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    setDeletingBookingId(bookingId);
    
    try {
      await deleteBooking(bookingId);
      alert("Booking deleted successfully!");
      refetchBookings(); // Refresh the bookings list
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      alert(error.response?.data?.message || "Failed to delete booking. Please try again.");
    } finally {
      setDeletingBookingId(null);
    }
  };

  // Check if booking is within 8-hour modification window
  const isWithinModificationWindow = (booking: BookingType): boolean => {
    const bookingCreatedAt = new Date(booking.createdAt || booking.checkIn);
    const now = new Date();
    const timeDifference = now.getTime() - bookingCreatedAt.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    
    return hoursDifference <= 8;
  };

  const getModificationTooltip = (booking: BookingType): string => {
    const bookingCreatedAt = new Date(booking.createdAt || booking.checkIn);
    const now = new Date();
    const timeDifference = now.getTime() - bookingCreatedAt.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 8 - hoursDifference);
    
    if (hoursDifference >= 8) {
      return "Booking modifications are only allowed within 8 hours of booking creation.";
    }
    
    return `Modifications allowed for ${Math.floor(hoursRemaining)}h ${Math.floor((hoursRemaining % 1) * 60)}m more`;
  };

  const handleEdit = (booking: BookingType, hotel: any) => {
    // Navigate to resort detail page with booking data for editing
    navigate(`/detail/${hotel._id}`, {
      state: {
        editMode: true,
        bookingId: booking._id,
        bookingData: {
          firstName: booking.firstName,
          lastName: booking.lastName,
          email: booking.email,
          phone: booking.phone,
          adultCount: booking.adultCount,
          childCount: booking.childCount,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          specialRequests: booking.specialRequests,
          isPwdBooking: (booking as any).isPwdBooking,
          isSeniorCitizenBooking: (booking as any).isSeniorCitizenBooking,
          selectedRooms: booking.selectedRooms,
          selectedCottages: booking.selectedCottages,
          selectedAmenities: booking.selectedAmenities,
        }
      }
    });
  };

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">My Bookings History</h1>
          <p className="text-blue-100 text-lg">
            Track all your hotel reservations and booking details
          </p>
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-blue-100">
                {totalBookings} Total Bookings
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span className="text-blue-100">
                {differentHotels} Different Hotels
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-blue-100">
                ₱{totalSpent.toFixed(2)} Total Spent
              </span>
            </div>
          </div>
        </div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 gap-8">
          {hotels.map((hotel, hotelIndex) => (
            <div
              key={`${hotel._id}-${hotelIndex}`}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Hotel Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <SmartImage
                      src={hotel.imageUrls[0]}
                      className="w-24 h-24 rounded-lg object-cover object-center shadow-md"
                      alt={hotel.name}
                      fallbackText="Hotel"
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                      {hotel.starRating}★
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {hotel.name}
                    </h2>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {hotel.city}, {hotel.country}
                        </span>
                      </div>
                       <div className="flex items-center gap-1 flex-wrap">
                         {hotel.hasDayRate && <Badge variant="outline" className="text-xs mr-1">₱{hotel.dayRate}/day</Badge>}
                         {hotel.hasNightRate && <Badge variant="outline" className="text-xs">₱{hotel.nightRate}/night</Badge>}
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="p-6">
                <div className="space-y-6">
                  {hotel.bookings.map((booking: BookingType) => {
                    const checkInDate = new Date(booking.checkIn);
                    const checkOutDate = new Date(booking.checkOut);
                    const createdAt = new Date(
                      booking.createdAt || booking.checkIn,
                    );
                     const nights = Math.max(
                       1,
                       Math.ceil(
                         (checkOutDate.getTime() - checkInDate.getTime()) /
                           (1000 * 60 * 60 * 24),
                       ),
                     );
                     const totalPrice = booking.totalCost || 0;

                    return (
                      <div
                        key={booking._id}
                        className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${getStatusColor(
                                booking.status || "pending",
                              )}`}
                            >
                              {getStatusIcon(booking.status || "pending")}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Booking #{booking._id.slice(-8).toUpperCase()}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Booked on {createdAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <div className="flex gap-2">
                              <Badge
                                className={`${getStatusColor(
                                  booking.status || "pending",
                                )} border`}
                              >
                                {getStatusIcon(booking.status || "pending")}
                                <span className="ml-1">
                                  {booking.status || "pending"}
                                </span>
                              </Badge>
                              <Badge
                                className={`${getPaymentStatusColor(
                                  booking.paymentStatus || "pending",
                                )} border`}
                              >
                                {booking.paymentStatus || "pending"}
                              </Badge>
                              {booking.paymentMethod && (
                                <Badge
                                  variant="outline"
                                  className="border-gray-300"
                                >
                                  {booking.paymentMethod}
                                </Badge>
                              )}
                            </div>
                            {/* Delete button - only show for confirmed or cancelled bookings */}
                            {(booking.status === "confirmed" || booking.status === "cancelled") && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(booking._id)}
                                disabled={deletingBookingId === booking._id}
                                className="ml-2"
                              >
                                <Trash className="w-4 h-4 mr-1" />
                                {deletingBookingId === booking._id ? "Deleting..." : "Delete"}
                              </Button>
                            )}
                            {/* Edit button - only show for pending/unconfirmed bookings within 8-hour window */}
                            {(booking.status === "pending" || !booking.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(booking, hotel)}
                                disabled={!isWithinModificationWindow(booking)}
                                className={`ml-2 ${!isWithinModificationWindow(booking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={getModificationTooltip(booking)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Booking Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {/* Dates */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span className="font-semibold text-gray-900">
                                Stay Dates
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">
                                <span className="font-medium">Check-in:</span>{" "}
                                {checkInDate.toDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Check-out:</span>{" "}
                                {checkOutDate.toDateString()}
                              </div>
                            </div>
                          </div>

                          {/* Guests */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-gray-900">
                                Guests
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">
                                <span className="font-medium">
                                  {booking.adultCount}
                                </span>{" "}
                                Adults
                              </div>
                              <div>
                                <span className="font-medium">
                                  {booking.childCount}
                                </span>{" "}
                                Children
                              </div>
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-purple-600" />
                              <span className="font-semibold text-gray-900">
                                Contact
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">{booking.email}</div>
                              {booking.phone && <div>{booking.phone}</div>}
                            </div>
                          </div>

                          {/* Pricing */}
                          {totalPrice > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <CreditCard className="w-4 h-4 text-orange-600" />
                                <span className="font-semibold text-gray-900">
                                  Pricing
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="mb-1">
                                  <span className="font-medium">{nights}</span>{" "}
                                  Nights
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  ₱{totalPrice}
                                </div>
                                {/* Only show refund if it exists and is greater than 0 */}
                                {booking.refundAmount !== undefined &&
                                  booking.refundAmount !== null &&
                                  booking.refundAmount > 0 && (
                                    <div className="text-sm text-red-600">
                                      Refund: ₱{booking.refundAmount}
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Special Requests & Cancellation */}
                        {(booking.specialRequests ||
                          booking.cancellationReason) && (
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {booking.specialRequests && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                  <Package className="w-4 h-4" />
                                  Special Requests
                                </h4>
                                <p className="text-blue-700 text-sm">
                                  {booking.specialRequests}
                                </p>
                              </div>
                            )}
                            {booking.cancellationReason && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                  <Building className="w-4 h-4" />
                                  Cancellation Reason
                                </h4>
                                <p className="text-red-700 text-sm">
                                  {booking.cancellationReason}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* GCash Payment Verification */}
                        {booking.paymentMethod === "gcash" && (
                          <div className="mt-6">
                            <PaymentVerificationCard
                              booking={booking}
                              showActions={false}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyBookings;

