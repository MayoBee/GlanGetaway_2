import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import { useMutation } from "react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Badge } from "../../../shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import {
  MonitorPlay,
  Users,
  Calendar,
  CreditCard,
  Receipt,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  User,
  Clock,
  Building2,
  DollarSign,
  Check,
} from "lucide-react";

interface Room {
  _id: string;
  name: string;
  type: string;
  pricePerNight: number;
  maxOccupancy: number;
  description?: string;
}

interface Cottage {
  _id: string;
  name: string;
  type: string;
  pricePerNight: number;
  maxOccupancy: number;
  description?: string;
}

interface Amenity {
  _id: string;
  name: string;
  price: number;
  description?: string;
}

const Kiosk = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Guest information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);

  // Stay details
  const [checkIn, setCheckIn] = useState(new Date().toISOString().split("T")[0]);
  const [checkOut, setCheckOut] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0]
  );
  const [checkInTime, setCheckInTime] = useState("12:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");

  // Selected items
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]);
  const [selectedCottages, setSelectedCottages] = useState<Cottage[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);

  // Walk-in details
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [idType, setIdType] = useState("government_id");
  const [idNumber, setIdNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Discounts
  const [isPwdBooking, setIsPwdBooking] = useState(false);
  const [isSeniorCitizenBooking, setIsSeniorCitizenBooking] = useState(false);

  // UI state
  const [showReceipt, setShowReceipt] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [hotelData, setHotelData] = useState<any>(null);

  // Fetch hotel data
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const data = await apiClient.fetchHotelById(hotelId!);
        setHotelData(data);
      } catch (error) {
        console.error("Error fetching hotel data:", error);
      }
    };
    if (hotelId) {
      fetchHotelData();
    }
  }, [hotelId]);

  // Calculate total cost
  const calculateTotalCost = () => {
    let total = 0;
    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    selectedRooms.forEach((room) => {
      total += room.pricePerNight * nights;
    });

    selectedCottages.forEach((cottage) => {
      total += cottage.pricePerNight * nights;
    });

    selectedAmenities.forEach((amenity) => {
      total += amenity.price;
    });

    // Apply discounts
    if (isPwdBooking) {
      total *= 0.8; // 20% discount
    } else if (isSeniorCitizenBooking) {
      total *= 0.88; // 12% discount
    }

    return total;
  };

  // Add room to selection
  const addRoom = (room: Room) => {
    if (!selectedRooms.find((r) => r._id === room._id)) {
      setSelectedRooms([...selectedRooms, room]);
    }
  };

  // Remove room from selection
  const removeRoom = (roomId: string) => {
    setSelectedRooms(selectedRooms.filter((r) => r._id !== roomId));
  };

  // Add cottage to selection
  const addCottage = (cottage: Cottage) => {
    if (!selectedCottages.find((c) => c._id === cottage._id)) {
      setSelectedCottages([...selectedCottages, cottage]);
    }
  };

  // Remove cottage from selection
  const removeCottage = (cottageId: string) => {
    setSelectedCottages(selectedCottages.filter((c) => c._id !== cottageId));
  };

  // Add amenity to selection
  const addAmenity = (amenity: Amenity) => {
    if (!selectedAmenities.find((a) => a._id === amenity._id)) {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // Remove amenity from selection
  const removeAmenity = (amenityId: string) => {
    setSelectedAmenities(selectedAmenities.filter((a) => a._id !== amenityId));
  };

  // Create walk-in booking mutation
  const createWalkInMutation = useMutation(
    (data: any) =>
      apiClient.createWalkInBooking({
        ...data,
        hotelId,
      }),
    {
      onSuccess: (response) => {
        setCreatedBooking(response.booking);
        setShowReceipt(true);
      },
      onError: (error: any) => {
        alert(error.response?.data?.message || "Failed to create walk-in booking");
      },
    }
  );

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRooms.length === 0 && selectedCottages.length === 0) {
      alert("Please select at least one room or cottage");
      return;
    }

    const bookingData = {
      firstName,
      lastName,
      email,
      phone,
      adultCount,
      childCount,
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
      selectedRooms,
      selectedCottages,
      selectedAmenities,
      walkInDetails: {
        paymentMethod,
        idType,
        idNumber,
        notes,
      },
      specialRequests: notes,
      isPwdBooking,
      isSeniorCitizenBooking,
    };

    createWalkInMutation.mutate(bookingData);
  };

  // Handle new booking
  const handleNewBooking = () => {
    setShowReceipt(false);
    setCreatedBooking(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setAdultCount(1);
    setChildCount(0);
    setCheckIn(new Date().toISOString().split("T")[0]);
    setCheckOut(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    setSelectedRooms([]);
    setSelectedCottages([]);
    setSelectedAmenities([]);
    setIdNumber("");
    setNotes("");
    setIsPwdBooking(false);
    setIsSeniorCitizenBooking(false);
    setCurrentStep(1);
  };

  // Print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Wizard navigation
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return firstName && lastName && email && phone && adultCount > 0;
      case 2:
        return checkIn && checkOut && new Date(checkIn) < new Date(checkOut);
      case 3:
        return true; // Room selection is optional
      case 4:
        return true; // Cottage selection is optional
      case 5:
        return true; // Amenity selection is optional
      case 6:
        return paymentMethod;
      case 7:
        return selectedRooms.length > 0 || selectedCottages.length > 0;
      default:
        return true;
    }
  };

  const canProceed = () => validateStep(currentStep);

  if (!hotelData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center">Loading resort data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showReceipt && createdBooking) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => setShowReceipt(false)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Kiosk
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Walk-in Booking Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Booking Confirmed!</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-semibold">
                    {createdBooking._id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guest:</span>
                  <span className="font-semibold">
                    {createdBooking.firstName} {createdBooking.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-in:</span>
                  <span className="font-semibold">
                    {new Date(createdBooking.checkIn).toLocaleDateString()} at{" "}
                    {createdBooking.checkInTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-out:</span>
                  <span className="font-semibold">
                    {new Date(createdBooking.checkOut).toLocaleDateString()} at{" "}
                    {createdBooking.checkOutTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold uppercase">
                    {createdBooking.walkInDetails?.paymentMethod}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Paid:</span>
                  <span className="text-green-600">
                    ₱{createdBooking.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePrintReceipt}
                  className="flex-1"
                  variant="outline"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button onClick={handleNewBooking} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  New Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate("/my-hotels")}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Resorts
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-100">
              <MonitorPlay className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Walk-in Kiosk
              </h1>
              <p className="text-gray-600">
                {hotelData.name} - Fast-entry booking system
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStepClick(step)}
                    disabled={step > currentStep}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      step <= currentStep
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {step < currentStep ? <Check className="w-5 h-5" /> : step}
                  </button>
                  <span className="text-xs mt-2 text-gray-600 font-medium">
                    {step === 1 && "Guest"}
                    {step === 2 && "Dates"}
                    {step === 3 && "Rooms"}
                    {step === 4 && "Cottages"}
                    {step === 5 && "Amenities"}
                    {step === 6 && "Payment"}
                    {step === 7 && "Review"}
                  </span>
                </div>
                {step < 7 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      step < currentStep ? "bg-purple-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <User className="w-5 h-5" />}
              {currentStep === 2 && <Calendar className="w-5 h-5" />}
              {currentStep === 3 && <Building2 className="w-5 h-5" />}
              {currentStep === 4 && <Building2 className="w-5 h-5" />}
              {currentStep === 5 && <DollarSign className="w-5 h-5" />}
              {currentStep === 6 && <CreditCard className="w-5 h-5" />}
              {currentStep === 7 && <Receipt className="w-5 h-5" />}
              {currentStep === 1 && "Guest Information"}
              {currentStep === 2 && "Stay Details"}
              {currentStep === 3 && "Select Rooms"}
              {currentStep === 4 && "Select Cottages"}
              {currentStep === 5 && "Select Amenities"}
              {currentStep === 6 && "Payment Details"}
              {currentStep === 7 && "Review & Confirm"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Step 1: Guest Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      className="text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="guest@email.com"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789"
                    className="text-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adultCount">Adults *</Label>
                    <Input
                      id="adultCount"
                      type="number"
                      min="1"
                      value={adultCount}
                      onChange={(e) => setAdultCount(parseInt(e.target.value))}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="childCount">Children</Label>
                    <Input
                      id="childCount"
                      type="number"
                      min="0"
                      value={childCount}
                      onChange={(e) => setChildCount(parseInt(e.target.value))}
                      className="text-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Stay Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check-in Date *</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check-out Date *</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkInTime">Check-in Time</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutTime">Check-out Time</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Discounts</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isPwdBooking ? "default" : "outline"}
                      onClick={() => {
                        setIsPwdBooking(!isPwdBooking);
                        setIsSeniorCitizenBooking(false);
                      }}
                      className="flex-1"
                    >
                      PWD (20%)
                    </Button>
                    <Button
                      type="button"
                      variant={isSeniorCitizenBooking ? "default" : "outline"}
                      onClick={() => {
                        setIsSeniorCitizenBooking(!isSeniorCitizenBooking);
                        setIsPwdBooking(false);
                      }}
                      className="flex-1"
                    >
                      Senior (12%)
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Room Selection */}
            {currentStep === 3 && (
              <div>
                {hotelData.rooms && hotelData.rooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotelData.rooms.map((room: Room) => (
                      <Card
                        key={room._id}
                        className={`cursor-pointer transition-all ${
                          selectedRooms.find((r) => r._id === room._id)
                            ? "ring-2 ring-purple-500 bg-purple-50"
                            : "hover:shadow-lg"
                        }`}
                        onClick={() => {
                          if (selectedRooms.find((r) => r._id === room._id)) {
                            removeRoom(room._id);
                          } else {
                            addRoom(room);
                          }
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{room.name}</h3>
                            <Badge variant="outline">{room.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Max: {room.maxOccupancy} guests
                          </p>
                          <p className="text-lg font-bold text-purple-600">
                            ₱{room.pricePerNight}/night
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No rooms available</p>
                )}
              </div>
            )}

            {/* Step 4: Cottage Selection */}
            {currentStep === 4 && (
              <div>
                {hotelData.cottages && hotelData.cottages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotelData.cottages.map((cottage: Cottage) => (
                      <Card
                        key={cottage._id}
                        className={`cursor-pointer transition-all ${
                          selectedCottages.find((c) => c._id === cottage._id)
                            ? "ring-2 ring-purple-500 bg-purple-50"
                            : "hover:shadow-lg"
                        }`}
                        onClick={() => {
                          if (selectedCottages.find((c) => c._id === cottage._id)) {
                            removeCottage(cottage._id);
                          } else {
                            addCottage(cottage);
                          }
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{cottage.name}</h3>
                            <Badge variant="outline">{cottage.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Max: {cottage.maxOccupancy} guests
                          </p>
                          <p className="text-lg font-bold text-purple-600">
                            ₱{cottage.pricePerNight}/night
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No cottages available</p>
                )}
              </div>
            )}

            {/* Step 5: Amenity Selection */}
            {currentStep === 5 && (
              <div>
                {hotelData.amenities && hotelData.amenities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hotelData.amenities.map((amenity: Amenity) => (
                      <Card
                        key={amenity._id}
                        className={`cursor-pointer transition-all ${
                          selectedAmenities.find((a) => a._id === amenity._id)
                            ? "ring-2 ring-purple-500 bg-purple-50"
                            : "hover:shadow-lg"
                        }`}
                        onClick={() => {
                          if (selectedAmenities.find((a) => a._id === amenity._id)) {
                            removeAmenity(amenity._id);
                          } else {
                            addAmenity(amenity);
                          }
                        }}
                      >
                        <CardContent className="pt-4">
                          <h3 className="font-semibold mb-2">{amenity.name}</h3>
                          {amenity.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {amenity.description}
                            </p>
                          )}
                          <p className="text-lg font-bold text-purple-600">
                            ₱{amenity.price}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No amenities available</p>
                )}
              </div>
            )}

            {/* Step 6: Payment Details */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="gcash">GCash</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idType">ID Type</Label>
                    <Select value={idType} onValueChange={setIdType}>
                      <SelectTrigger className="text-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="government_id">
                          Government ID
                        </SelectItem>
                        <SelectItem value="driver_license">
                          Driver's License
                        </SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Enter ID number"
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes / Special Requests</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    className="w-full p-3 border rounded-lg text-lg min-h-[100px]"
                  />
                </div>
              </div>
            )}

            {/* Step 7: Review & Confirm */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-700">Guest:</h4>
                    <p className="text-lg">
                      {firstName} {lastName}
                    </p>
                    <p className="text-gray-600">{email}</p>
                    <p className="text-gray-600">{phone}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700">Stay:</h4>
                    <p>
                      {new Date(checkIn).toLocaleDateString()} at {checkInTime} -{" "}
                      {new Date(checkOut).toLocaleDateString()} at {checkOutTime}
                    </p>
                    <p className="text-gray-600">
                      {adultCount} adults, {childCount} children
                    </p>
                  </div>
                  {selectedRooms.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Rooms:</h4>
                      {selectedRooms.map((room) => (
                        <p key={room._id}>
                          {room.name} - ₱{room.pricePerNight}/night
                        </p>
                      ))}
                    </div>
                  )}
                  {selectedCottages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Cottages:</h4>
                      {selectedCottages.map((cottage) => (
                        <p key={cottage._id}>
                          {cottage.name} - ₱{cottage.pricePerNight}/night
                        </p>
                      ))}
                    </div>
                  )}
                  {selectedAmenities.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700">Amenities:</h4>
                      {selectedAmenities.map((amenity) => (
                        <p key={amenity._id}>
                          {amenity.name} - ₱{amenity.price}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-purple-600">
                        ₱{calculateTotalCost().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="px-8"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          {currentStep === 7 ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || createWalkInMutation.isLoading}
              className="px-8"
            >
              {createWalkInMutation.isLoading
                ? "Processing..."
                : "Complete Booking"}
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kiosk;
