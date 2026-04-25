import { useState } from "react";
import { useForm } from "react-hook-form";
import axiosInstance from "../../../shared/auth/api-client";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/ui/select";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Users, CreditCard, User, Phone, Mail, FileText, CheckCircle } from "lucide-react";

interface WalkInFormData {
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  adultCount: number;
  childCount: number;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  totalCost: number;
  basePrice: number;
  selectedRooms: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
  }>;
  selectedCottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
  }>;
  selectedAmenities?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  specialRequests?: string;
  isPwdBooking: boolean;
  isSeniorCitizenBooking: boolean;
  // Walk-in specific fields
  guestIdType?: string;
  guestIdNumber?: string;
  onSitePaymentMethod: string;
  receiptNumber?: string;
}

interface HotelData {
  _id: string;
  name: string;
  rooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
  }>;
  cottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    maxOccupancy: number;
  }>;
  amenities?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

type Props = {
  hotel: HotelData;
  onClose: () => void;
  onSuccess: () => void;
};

const WalkInBookingForm = ({ hotel, onClose, onSuccess }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<Array<{ id: string; name: string; type: string; pricePerNight: number; maxOccupancy: number }>>([]);
  const [selectedCottages, setSelectedCottages] = useState<Array<{ id: string; name: string; type: string; pricePerNight: number; maxOccupancy: number }>>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Array<{ id: string; name: string; price: number }>>([]);
  const [totalCost, setTotalCost] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<WalkInFormData>({
    defaultValues: {
      hotelId: hotel._id,
      adultCount: 1,
      childCount: 0,
      checkInTime: "12:00",
      checkOutTime: "11:00",
      isPwdBooking: false,
      isSeniorCitizenBooking: false,
      onSitePaymentMethod: "cash",
    },
  });

  const watchAdultCount = watch("adultCount");
  const watchChildCount = watch("childCount");
  const watchCheckIn = watch("checkIn");
  const watchCheckOut = watch("checkOut");

  // Calculate total cost when selections change
  const calculateTotal = () => {
    let total = 0;
    selectedRooms.forEach((room) => (total += room.pricePerNight));
    selectedCottages.forEach((cottage) => (total += cottage.pricePerNight));
    selectedAmenities.forEach((amenity) => (total += amenity.price));
    setTotalCost(total);
    setValue("totalCost", total);
    setValue("basePrice", total);
  };

  // Toggle room selection
  const toggleRoom = (room: { id: string; name: string; type: string; pricePerNight: number; maxOccupancy: number }) => {
    const exists = selectedRooms.find((r) => r.id === room.id);
    if (exists) {
      setSelectedRooms(selectedRooms.filter((r) => r.id !== room.id));
    } else {
      setSelectedRooms([...selectedRooms, room]);
    }
    calculateTotal();
  };

  // Toggle cottage selection
  const toggleCottage = (cottage: { id: string; name: string; type: string; pricePerNight: number; maxOccupancy: number }) => {
    const exists = selectedCottages.find((c) => c.id === cottage.id);
    if (exists) {
      setSelectedCottages(selectedCottages.filter((c) => c.id !== cottage.id));
    } else {
      setSelectedCottages([...selectedCottages, cottage]);
    }
    calculateTotal();
  };

  // Toggle amenity selection
  const toggleAmenity = (amenity: { id: string; name: string; price: number }) => {
    const exists = selectedAmenities.find((a) => a.id === amenity.id);
    if (exists) {
      setSelectedAmenities(selectedAmenities.filter((a) => a.id !== amenity.id));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
    calculateTotal();
  };

  const onSubmit = async (data: WalkInFormData) => {
    if (selectedRooms.length === 0 && selectedCottages.length === 0) {
      setError("Please select at least one room or cottage");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookingData = {
        ...data,
        selectedRooms,
        selectedCottages,
        selectedAmenities,
        totalCost,
        basePrice: totalCost,
      };

      const response = await axiosInstance.post("/api/bookings/walk-in", bookingData);

      if (response.status === 201) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Error creating walk-in booking:", err);
      setError(err.response?.data?.message || "Failed to create walk-in booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Walk-in Booking - {hotel.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Guest Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Guest Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register("firstName", { required: "First name is required" })}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register("lastName", { required: "Last name is required" })}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  {...register("phone", { required: "Phone is required" })}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Dates & Occupancy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dates & Occupancy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date *</Label>
                <Input
                  id="checkIn"
                  type="date"
                  {...register("checkIn", { required: "Check-in date is required" })}
                  className={errors.checkIn ? "border-red-500" : ""}
                />
                {errors.checkIn && <p className="text-red-500 text-sm mt-1">{errors.checkIn.message}</p>}
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date *</Label>
                <Input
                  id="checkOut"
                  type="date"
                  {...register("checkOut", { required: "Check-out date is required" })}
                  className={errors.checkOut ? "border-red-500" : ""}
                />
                {errors.checkOut && <p className="text-red-500 text-sm mt-1">{errors.checkOut.message}</p>}
              </div>
              <div>
                <Label htmlFor="checkInTime">Check-in Time</Label>
                <Input id="checkInTime" type="time" {...register("checkInTime")} />
              </div>
              <div>
                <Label htmlFor="checkOutTime">Check-out Time</Label>
                <Input id="checkOutTime" type="time" {...register("checkOutTime")} />
              </div>
              <div>
                <Label htmlFor="adultCount">Adults *</Label>
                <Input
                  id="adultCount"
                  type="number"
                  min="1"
                  {...register("adultCount", { required: "Adult count is required", min: 1 })}
                  className={errors.adultCount ? "border-red-500" : ""}
                />
                {errors.adultCount && <p className="text-red-500 text-sm mt-1">{errors.adultCount.message}</p>}
              </div>
              <div>
                <Label htmlFor="childCount">Children</Label>
                <Input
                  id="childCount"
                  type="number"
                  min="0"
                  {...register("childCount", { min: 0 })}
                  className={errors.childCount ? "border-red-500" : ""}
                />
                {errors.childCount && <p className="text-red-500 text-sm mt-1">{errors.childCount.message}</p>}
              </div>
            </div>
          </div>

          {/* Room Selection */}
          {hotel.rooms && hotel.rooms.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotel.rooms.map((room) => (
                  <Card
                    key={room.id}
                    className={`cursor-pointer transition-all ${
                      selectedRooms.find((r) => r.id === room.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    onClick={() => toggleRoom(room)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{room.name}</p>
                          <p className="text-sm text-gray-500">{room.type}</p>
                          <p className="text-sm text-gray-500">Max: {room.maxOccupancy} guests</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₱{room.pricePerNight}</p>
                          {selectedRooms.find((r) => r.id === room.id) && (
                            <CheckCircle className="w-5 h-5 text-blue-500 mt-1" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Cottage Selection */}
          {hotel.cottages && hotel.cottages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Cottages</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotel.cottages.map((cottage) => (
                  <Card
                    key={cottage.id}
                    className={`cursor-pointer transition-all ${
                      selectedCottages.find((c) => c.id === cottage.id) ? "ring-2 ring-green-500 bg-green-50" : ""
                    }`}
                    onClick={() => toggleCottage(cottage)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{cottage.name}</p>
                          <p className="text-sm text-gray-500">{cottage.type}</p>
                          <p className="text-sm text-gray-500">Max: {cottage.maxOccupancy} guests</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₱{cottage.pricePerNight}</p>
                          {selectedCottages.find((c) => c.id === cottage.id) && (
                            <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Amenity Selection */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Amenities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hotel.amenities.map((amenity) => (
                  <Card
                    key={amenity.id}
                    className={`cursor-pointer transition-all ${
                      selectedAmenities.find((a) => a.id === amenity.id) ? "ring-2 ring-purple-500 bg-purple-50" : ""
                    }`}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{amenity.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">₱{amenity.price}</p>
                          {selectedAmenities.find((a) => a.id === amenity.id) && (
                            <CheckCircle className="w-5 h-5 text-purple-500 mt-1" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Discounts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Discounts</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isPwdBooking")}
                  className="w-4 h-4"
                />
                <span>PWD Discount</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register("isSeniorCitizenBooking")}
                  className="w-4 h-4"
                />
                <span>Senior Citizen Discount</span>
              </label>
            </div>
          </div>

          {/* Walk-in Specific Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Walk-in Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guestIdType">ID Type</Label>
                <Select onValueChange={(value) => setValue("guestIdType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="voters_id">Voter's ID</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="guestIdNumber">ID Number</Label>
                <Input id="guestIdNumber" {...register("guestIdNumber")} />
              </div>
              <div>
                <Label htmlFor="onSitePaymentMethod">Payment Method *</Label>
                <Select
                  onValueChange={(value) => setValue("onSitePaymentMethod", value)}
                  defaultValue="cash"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input id="receiptNumber" {...register("receiptNumber")} />
              </div>
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Input id="specialRequests" {...register("specialRequests")} placeholder="Any special requests..." />
          </div>

          {/* Total Cost Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Cost:</span>
              <span className="text-2xl font-bold text-green-600">₱{totalCost.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || totalCost === 0}>
              {loading ? "Creating Booking..." : "Create Walk-in Booking"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WalkInBookingForm;
