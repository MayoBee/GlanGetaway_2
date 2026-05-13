import { Link } from "react-router-dom";
import { useQueryWithLoading } from "../hooks/useLoadingHooks";
import { fetchMyHotels } from "../api-client";
import { BsMap } from "react-icons/bs";
import { BiMoney } from "react-icons/bi";
import {
  Edit,
  Eye,
  TrendingUp,
  Users,
  Star,
  Building2,
  Calendar,
  MonitorPlay,
  FileText,
  CreditCard,
  Activity,
  Lock,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import SmartImage from "../components/SmartImage";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import BookingLogModal from "../components/BookingLogModal";
import { useState } from "react";
import useAppContext from "../hooks/useAppContext";
import { useRoleBasedAccess } from "../hooks/useRoleBasedAccess";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../components/ui/tooltip";

const FrontDeskResorts = () => {
  const { isLoggedIn } = useAppContext();
  const { permissions } = useRoleBasedAccess();
  const [selectedHotel, setSelectedHotel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isBookingLogOpen, setIsBookingLogOpen] = useState(false);

  const handleOpenKiosk = (hotelId: string) => {
    window.location.href = `/kiosk/${hotelId}`;
  };

  const { data: hotelData } = useQueryWithLoading(
    "fetchMyHotels",
    fetchMyHotels,
    {
      onError: () => {},
      loadingMessage: "Loading assigned resorts...",
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
                <Building2 className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Manage Resort</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Access and manage resort features based on your permissions
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please sign in to access your assigned resort management features.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOpenBookingLog = (hotelId: string, hotelName: string) => {
    setSelectedHotel({ id: hotelId, name: hotelName });
    setIsBookingLogOpen(true);
  };

  const handleCloseBookingLog = () => {
    setIsBookingLogOpen(false);
    setSelectedHotel(null);
  };

  if (!hotelData || hotelData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-2xl p-8 max-w-md mx-auto">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No Assigned Resorts
          </h3>
          <p className="text-gray-500 mb-6">
            You haven't been assigned to any resorts yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Resort</h1>
          <p className="text-gray-600 mt-1">
            Access resort features based on your assigned permissions
          </p>
        </div>
      </div>

      {/* Permissions Overview */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Your Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {permissions.canManageBookings && (
            <Badge className="bg-blue-600 text-white">Bookings</Badge>
          )}
          {permissions.canManageRooms && (
            <Badge className="bg-green-600 text-white">Rooms</Badge>
          )}
          {permissions.canManageAmenities && (
            <Badge className="bg-purple-600 text-white">Amenities</Badge>
          )}
          {permissions.canManageActivities && (
            <Badge className="bg-orange-600 text-white">Activities</Badge>
          )}
          {permissions.canViewReports && (
            <Badge className="bg-yellow-600 text-white">Reports</Badge>
          )}
          {permissions.canManageBilling && (
            <Badge className="bg-red-600 text-white">Billing</Badge>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned Resorts</p>
              <p className="text-2xl font-bold text-gray-900">
                {hotelData.length}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {hotelData.reduce(
                  (sum, hotel) => sum + (hotel.totalBookings || 0),
                  0,
                )}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ₱
                {hotelData
                  .reduce((sum, hotel) => sum + (hotel.totalRevenue || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {hotelData.length > 0
                  ? (
                      hotelData.reduce(
                        (sum, hotel) => sum + (hotel.averageRating || 0),
                        0,
                      ) / hotelData.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Resorts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {hotelData.map((hotel) => (
          <div
            key={hotel._id}
            className="bg-white rounded-2xl shadow-soft hover:shadow-large transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full"
          >
            {/* Hotel Image */}
            <div className="relative h-48 overflow-hidden">
              <SmartImage
                src={hotel.imageUrls[0]}
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                fallbackText="Hotel Image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col space-y-2">
                <Badge className="bg-primary-600 text-white">
                  ₱{hotel.nightRate}/night
                </Badge>
                {hotel.isFeatured && (
                  <Badge className="bg-yellow-500 text-white">Featured</Badge>
                )}
                <Badge className={`${hotel.isApproved ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
                  {hotel.isApproved ? "Approved" : "Pending Approval"}
                </Badge>
              </div>

              <div className="absolute top-4 right-4">
                <Badge className="bg-white/90 text-gray-800">
                  <Star className="w-3 h-3 mr-1 text-yellow-500" />
                  {hotel.starRating}
                </Badge>
              </div>
            </div>

            {/* Hotel Content */}
            <div className="p-6 flex flex-col flex-grow">
              <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {hotel.name}
              </h2>

              <p className="text-gray-600 mb-4 line-clamp-2">
                {hotel.description}
              </p>

              {/* Hotel Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 flex-grow">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BsMap className="w-4 h-4 text-primary-600" />
                  <span>
                    {hotel.city}, {hotel.country}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <BiMoney className="w-4 h-4 text-primary-600" />
                  <span>₱{hotel.nightRate} per night</span>
                </div>
              </div>

              {/* Hotel Stats */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-xl mt-auto">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {hotel.totalBookings || 0}
                  </p>
                  <p className="text-xs text-gray-600">Bookings</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    ₱{(hotel.totalRevenue || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {hotel.averageRating?.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  {/* Edit Resort - Requires canManageRooms or canManageAmenities */}
                  {(permissions.canManageRooms || permissions.canManageAmenities) ? (
                    <Link
                      to={`/edit-hotel/${hotel._id}`}
                      className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors text-center flex items-center justify-center min-w-[120px]"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Resort
                    </Link>
                  ) : (
                    <Tooltip content="No permission to manage rooms or amenities">
                      <Button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center flex items-center justify-center min-w-[120px]"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Edit Resort
                      </Button>
                    </Tooltip>
                  )}

                  {/* View Details - Always available */}
                  <Link
                    to={`/detail/${hotel._id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-center flex items-center justify-center min-w-[120px]"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>

                  {/* Booking Log - Requires canManageBookings */}
                  {permissions.canManageBookings ? (
                    <button
                      onClick={() => handleOpenBookingLog(hotel._id, hotel.name)}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors text-center flex items-center justify-center min-w-[120px]"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Booking Log
                    </button>
                  ) : (
                    <Tooltip content="No permission to manage bookings">
                      <Button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center flex items-center justify-center min-w-[120px]"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Booking Log
                      </Button>
                    </Tooltip>
                  )}

                  {/* Reports - Requires canViewReports */}
                  {permissions.canViewReports ? (
                    <Link
                      to={`/resort/reports/${hotel._id}`}
                      className="flex-1 bg-yellow-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-yellow-700 transition-colors text-center flex items-center justify-center min-w-[120px]"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Reports
                    </Link>
                  ) : (
                    <Tooltip content="No permission to view reports">
                      <Button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center flex items-center justify-center min-w-[120px]"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Reports
                      </Button>
                    </Tooltip>
                  )}

                  {/* Billing - Requires canManageBilling */}
                  {permissions.canManageBilling ? (
                    <Link
                      to={`/resort/billing/${hotel._id}`}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors text-center flex items-center justify-center min-w-[120px]"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Billing
                    </Link>
                  ) : (
                    <Tooltip content="No permission to manage billing">
                      <Button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center flex items-center justify-center min-w-[120px]"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Billing
                      </Button>
                    </Tooltip>
                  )}

                  {/* Activities - Requires canManageActivities */}
                  {permissions.canManageActivities ? (
                    <Link
                      to={`/resort/activities/${hotel._id}`}
                      className="flex-1 bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-700 transition-colors text-center flex items-center justify-center min-w-[120px]"
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Activities
                    </Link>
                  ) : (
                    <Tooltip content="No permission to manage activities">
                      <Button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-3 px-4 rounded-xl font-semibold text-center flex items-center justify-center min-w-[120px]"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Activities
                      </Button>
                    </Tooltip>
                  )}

                  {/* Kiosk - Always available */}
                  <button
                    onClick={() => handleOpenKiosk(hotel._id)}
                    className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-center flex items-center justify-center min-w-[120px]"
                  >
                    <MonitorPlay className="w-4 h-4 mr-2" />
                    Kiosk
                  </button>
                </TooltipProvider>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Log Modal */}
      {selectedHotel && (
        <BookingLogModal
          isOpen={isBookingLogOpen}
          onClose={handleCloseBookingLog}
          hotelId={selectedHotel.id}
          hotelName={selectedHotel.name}
        />
      )}
    </div>
  );
};

export default FrontDeskResorts;
