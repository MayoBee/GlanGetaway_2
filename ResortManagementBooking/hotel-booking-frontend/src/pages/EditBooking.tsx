import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { axiosInstance } from "../api-client";
import type { BookingType, HotelType } from "../../../shared/types";
import { updateBooking } from "../api-client";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Calendar, Users, Phone, Mail, MapPin, ArrowLeft, Save, X } from "lucide-react";
import SmartImage from "../components/SmartImage";

const EditBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, hotel } = location.state || {};

  const [formData, setFormData] = useState({
    firstName: booking?.firstName || "",
    lastName: booking?.lastName || "",
    email: booking?.email || "",
    phone: booking?.phone || "",
    adultCount: booking?.adultCount || 1,
    childCount: booking?.childCount || 0,
    checkIn: booking?.checkIn ? new Date(booking.checkIn).toISOString().split('T')[0] : "",
    checkOut: booking?.checkOut ? new Date(booking.checkOut).toISOString().split('T')[0] : "",
    specialRequests: booking?.specialRequests || "",
    isPwdBooking: booking?.isPwdBooking || false,
    isSeniorCitizenBooking: booking?.isSeniorCitizenBooking || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!booking || !hotel) {
      navigate("/my-bookings");
    }
  }, [booking, hotel, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === "number") {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateTotalPrice = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate entrance fees (using night rate as default for existing bookings)
    let entranceFeeTotal = 0;
    const rateType = 'nightRate'; // Default to night rate for existing bookings
    
    // Adult entrance fees
    if (hotel.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0) {
      if (hotel.adultEntranceFee.pricingModel === 'per_group') {
        const groupsNeeded = Math.ceil(formData.adultCount / (hotel.adultEntranceFee.groupQuantity || 1));
        entranceFeeTotal += groupsNeeded * hotel.adultEntranceFee[rateType];
      } else {
        entranceFeeTotal += formData.adultCount * hotel.adultEntranceFee[rateType];
      }
    }

    // Child entrance fees
    if (hotel.childEntranceFee && hotel.childEntranceFee.length > 0) {
      // For edit form, use simplified child calculation since we don't have individual ages
      if (formData.childCount > 0 && hotel.adultEntranceFee && hotel.adultEntranceFee[rateType] > 0) {
        if (hotel.adultEntranceFee.pricingModel === 'per_group') {
          const groupsNeeded = Math.ceil(formData.childCount / (hotel.adultEntranceFee.groupQuantity || 1));
          entranceFeeTotal += groupsNeeded * hotel.adultEntranceFee[rateType];
        } else {
          entranceFeeTotal += formData.childCount * hotel.adultEntranceFee[rateType];
        }
      }
    }

    let totalPrice = entranceFeeTotal;
    
    // Apply discounts if applicable
    if (formData.isPwdBooking || formData.isSeniorCitizenBooking) {
      totalPrice *= 0.8; // 20% discount for PWD/Senior Citizen
    }
    
    return Math.round(totalPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

     try {
       const updatedBooking = {
         ...formData,
         checkIn: new Date(formData.checkIn),
         checkOut: new Date(formData.checkOut),
         totalCost: calculateTotalPrice(),
         basePrice: calculateTotalPrice() / (formData.isPwdBooking || formData.isSeniorCitizenBooking ? 0.8 : 1),
       };

      await updateBooking(booking._id, updatedBooking);
      alert("Booking updated successfully!");
      navigate("/my-bookings");
    } catch (error: any) {
      console.error("Error updating booking:", error);
      setError(error.response?.data?.message || "Failed to update booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!booking || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/my-bookings")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Bookings
        </Button>
        
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Edit Booking</h1>
          <p className="text-blue-100">Modify your reservation details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hotel Info Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <SmartImage
                  src={hotel.imageUrls[0]}
                  className="w-16 h-16 rounded-lg object-cover"
                  alt={hotel.name}
                  fallbackText="Hotel"
                />
                <div>
                  <CardTitle className="text-lg">{hotel.name}</CardTitle>
                  <p className="text-sm text-gray-500">{hotel.city}, {hotel.country}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{hotel.city}, {hotel.country}</span>
                </div>
                 <div className="flex items-center gap-2 flex-wrap">
                   {hotel.hasDayRate && <Badge variant="outline" className="text-xs">₱{hotel.dayRate}/day</Badge>}
                   {hotel.hasNightRate && <Badge variant="outline" className="text-xs">₱{hotel.nightRate}/night</Badge>}
                 </div>
                <Badge variant="outline">
                  {booking.status || "pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Price Calculation Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Price Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                 <div className="flex justify-between">
                   <span>Entrance Fee:</span>
                   <span>Calculated per guest</span>
                 </div>
                 {hotel.hasDayRate && (
                   <div className="flex justify-between text-xs text-gray-500">
                     <span>Day Rate:</span>
                     <span>₱{hotel.dayRate}</span>
                   </div>
                 )}
                 {hotel.hasNightRate && (
                   <div className="flex justify-between text-xs text-gray-500">
                     <span>Night Rate:</span>
                     <span>₱{hotel.nightRate}</span>
                   </div>
                 )}
                {formData.checkIn && formData.checkOut && (
                  <div className="flex justify-between">
                    <span>Nights:</span>
                    <span>
                      {Math.max(1, Math.ceil(
                        (new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / 
                        (1000 * 60 * 60 * 24)
                      ))}
                    </span>
                  </div>
                )}
                {(formData.isPwdBooking || formData.isSeniorCitizenBooking) && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount (20%):</span>
                    <span>-₱{Math.round(calculateTotalPrice() * 0.25)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">₱{calculateTotalPrice()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Guest Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Stay Dates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-in Date</label>
                      <input
                        type="date"
                        name="checkIn"
                        value={formData.checkIn}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-out Date</label>
                      <input
                        type="date"
                        name="checkOut"
                        value={formData.checkOut}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Number of Guests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Adults</label>
                      <input
                        type="number"
                        name="adultCount"
                        value={formData.adultCount}
                        onChange={handleInputChange}
                        min="1"
                        className="w-full p-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Children</label>
                      <input
                        type="number"
                        name="childCount"
                        value={formData.childCount}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full p-2 border rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Discounts */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Special Discounts</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isPwdBooking"
                        checked={formData.isPwdBooking}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span className="text-sm">PWD Discount (20% off)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isSeniorCitizenBooking"
                        checked={formData.isSeniorCitizenBooking}
                        onChange={handleInputChange}
                        className="rounded"
                      />
                      <span className="text-sm">Senior Citizen Discount (20% off)</span>
                    </label>
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Special Requests</h3>
                  <textarea
                    name="specialRequests"
                    value={formData.specialRequests}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Any special requests or requirements..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Updating..." : "Update Booking"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/my-bookings")}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditBooking;

