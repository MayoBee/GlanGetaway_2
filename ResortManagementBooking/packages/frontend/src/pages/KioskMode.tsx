import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../shared/auth/api-client";
import { Button } from "../../../shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  X, 
  Plus, 
  Minus,
  Receipt,
  Printer,
  ArrowRight
} from "lucide-react";

interface HotelData {
  _id: string;
  name: string;
  city: string;
  country: string;
  imageUrls: string[];
  rooms?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    dayRate: number;
    nightRate: number;
    hasDayRate: boolean;
    hasNightRate: boolean;
    maxOccupancy: number;
    description?: string;
  }>;
  cottages?: Array<{
    id: string;
    name: string;
    type: string;
    pricePerNight: number;
    dayRate: number;
    nightRate: number;
    hasDayRate: boolean;
    hasNightRate: boolean;
    maxOccupancy: number;
    description?: string;
  }>;
  amenities?: Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
  }>;
  packages?: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    includedCottages: string[];
    includedRooms: string[];
    includedAmenities: string[];
    includedAdultEntranceFee: boolean;
    includedChildEntranceFee: boolean;
  }>;
  adultEntranceFee?: {
    dayRate: number;
    nightRate: number;
    pricingModel: "per_head" | "per_group";
    groupQuantity?: number;
  };
  childEntranceFee?: Array<{
    id: string;
    minAge: number;
    maxAge: number;
    dayRate: number;
    nightRate: number;
    pricingModel: "per_head" | "per_group";
    groupQuantity?: number;
  }>;
}

interface CartItem {
  type: "room" | "cottage" | "amenity" | "package" | "entrance_adult" | "entrance_child";
  id: string;
  name: string;
  price: number;
  quantity: number;
  rateType?: "day" | "night";
  details?: any;
}

const KioskMode = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRateType, setSelectedRateType] = useState<"day" | "night">("day");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [adultCount, setAdultCount] = useState(1);
  const [childCount, setChildCount] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  useEffect(() => {
    fetchHotelData();
  }, [hotelId]);

  const fetchHotelData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/hotels/${hotelId}`);
      setHotel(response.data);
    } catch (error) {
      console.error("Error fetching hotel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: CartItem) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = quantity;
    setCart(newCart);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleAddRoom = (room: any) => {
    const price = selectedRateType === "day" && room.hasDayRate ? room.dayRate : 
                  selectedRateType === "night" && room.hasNightRate ? room.nightRate : 
                  room.pricePerNight;
    
    addToCart({
      type: "room",
      id: room.id,
      name: room.name,
      price: price,
      quantity: 1,
      rateType: selectedRateType,
      details: room
    });
  };

  const handleAddCottage = (cottage: any) => {
    const price = selectedRateType === "day" && cottage.hasDayRate ? cottage.dayRate : 
                  selectedRateType === "night" && cottage.hasNightRate ? cottage.nightRate : 
                  cottage.pricePerNight;
    
    addToCart({
      type: "cottage",
      id: cottage.id,
      name: cottage.name,
      price: price,
      quantity: 1,
      rateType: selectedRateType,
      details: cottage
    });
  };

  const handleAddAmenity = (amenity: any) => {
    addToCart({
      type: "amenity",
      id: amenity.id,
      name: amenity.name,
      price: amenity.price,
      quantity: 1,
      details: amenity
    });
  };

  const handleAddPackage = (pkg: any) => {
    addToCart({
      type: "package",
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      quantity: 1,
      details: pkg
    });
  };

  const handleAddEntranceFee = (type: "adult" | "child", feeData?: any) => {
    const price = selectedRateType === "day" ? feeData?.dayRate : feeData?.nightRate;
    const quantity = type === "adult" ? adultCount : childCount;
    const name = type === "adult" ? "Adult Entrance Fee" : `Child Entrance Fee (${feeData?.minAge}-${feeData?.maxAge} years)`;
    
    if (price > 0 && quantity > 0) {
      addToCart({
        type: type === "adult" ? "entrance_adult" : "entrance_child",
        id: type === "adult" ? "adult_entrance" : `child_entrance_${feeData?.id}`,
        name: name,
        price: price,
        quantity: quantity,
        rateType: selectedRateType,
        details: feeData
      });
    }
  };

  const handlePrintOrder = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Resort not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
              <p className="text-gray-600">{hotel.city}, {hotel.country}</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowCart(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
              >
                <Receipt className="w-5 h-5 mr-2" />
                View Order ({cart.length})
              </Button>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="px-6 py-3 text-lg"
              >
                <X className="w-5 h-5 mr-2" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Type Selector */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Select Rate Type</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedRateType("day")}
              className={`p-6 rounded-lg border-4 text-center transition-all ${
                selectedRateType === "day"
                  ? "bg-blue-100 border-blue-600 text-blue-900"
                  : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
              }`}
            >
              <Clock className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">Day Rate</h3>
              <p className="text-sm mt-2">Perfect for day trips</p>
              <p className="text-xs mt-1">Check-in flexible, Check-out 5:00 PM</p>
            </button>
            <button
              onClick={() => setSelectedRateType("night")}
              className={`p-6 rounded-lg border-4 text-center transition-all ${
                selectedRateType === "night"
                  ? "bg-green-100 border-green-600 text-green-900"
                  : "bg-white border-gray-300 text-gray-700 hover:border-green-300"
              }`}
            >
              <Clock className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">Night Rate</h3>
              <p className="text-sm mt-2">Ideal for overnight stays</p>
              <p className="text-xs mt-1">24-hour accommodation</p>
            </button>
          </div>
        </div>

        {/* Guest Count */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Number of Guests
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <label className="block text-lg font-semibold mb-2">Adults</label>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setAdultCount(Math.max(1, adultCount - 1))}
                  variant="outline"
                  size="lg"
                  className="w-12 h-12"
                >
                  <Minus className="w-6 h-6" />
                </Button>
                <span className="text-4xl font-bold w-20 text-center">{adultCount}</span>
                <Button
                  onClick={() => setAdultCount(adultCount + 1)}
                  variant="outline"
                  size="lg"
                  className="w-12 h-12"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <label className="block text-lg font-semibold mb-2">Children</label>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setChildCount(Math.max(0, childCount - 1))}
                  variant="outline"
                  size="lg"
                  className="w-12 h-12"
                >
                  <Minus className="w-6 h-6" />
                </Button>
                <span className="text-4xl font-bold w-20 text-center">{childCount}</span>
                <Button
                  onClick={() => setChildCount(childCount + 1)}
                  variant="outline"
                  size="lg"
                  className="w-12 h-12"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Entrance Fees */}
        {(hotel.adultEntranceFee || hotel.childEntranceFee) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Entrance Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotel.adultEntranceFee && (
                <Card className="border-2 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">Adult Entrance Fee</h3>
                        <p className="text-2xl font-bold text-blue-600 mt-2">
                          ₱{selectedRateType === "day" ? hotel.adultEntranceFee.dayRate : hotel.adultEntranceFee.nightRate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {hotel.adultEntranceFee.pricingModel === "per_group" 
                            ? `Per Group (${hotel.adultEntranceFee.groupQuantity} people)` 
                            : "Per Person"}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAddEntranceFee("adult", hotel.adultEntranceFee)}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {hotel.childEntranceFee && hotel.childEntranceFee.map((childFee) => (
                <Card key={childFee.id} className="border-2 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">Child Entrance Fee</h3>
                        <p className="text-sm text-gray-600">Ages {childFee.minAge}-{childFee.maxAge} years</p>
                        <p className="text-2xl font-bold text-green-600 mt-2">
                          ₱{selectedRateType === "day" ? childFee.dayRate : childFee.nightRate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {childFee.pricingModel === "per_group" 
                            ? `Per Group (${childFee.groupQuantity} people)` 
                            : "Per Person"}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleAddEntranceFee("child", childFee)}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rooms */}
        {hotel.rooms && hotel.rooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Rooms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotel.rooms.map((room) => (
                <Card key={room.id} className="border-2 hover:border-blue-400 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{room.name}</h3>
                        <p className="text-gray-600">{room.type}</p>
                        <p className="text-sm text-gray-500">Max: {room.maxOccupancy} guests</p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {selectedRateType === "day" && room.hasDayRate ? "Day Rate" : "Night Rate"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-blue-600">
                        ₱{selectedRateType === "day" && room.hasDayRate ? room.dayRate : 
                           selectedRateType === "night" && room.hasNightRate ? room.nightRate : 
                           room.pricePerNight}
                      </p>
                      <Button
                        onClick={() => handleAddRoom(room)}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Cottages */}
        {hotel.cottages && hotel.cottages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Cottages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotel.cottages.map((cottage) => (
                <Card key={cottage.id} className="border-2 hover:border-green-400 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{cottage.name}</h3>
                        <p className="text-gray-600">{cottage.type}</p>
                        <p className="text-sm text-gray-500">Max: {cottage.maxOccupancy} guests</p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {selectedRateType === "day" && cottage.hasDayRate ? "Day Rate" : "Night Rate"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-green-600">
                        ₱{selectedRateType === "day" && cottage.hasDayRate ? cottage.dayRate : 
                           selectedRateType === "night" && cottage.hasNightRate ? cottage.nightRate : 
                           cottage.pricePerNight}
                      </p>
                      <Button
                        onClick={() => handleAddCottage(cottage)}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Amenities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotel.amenities.map((amenity) => (
                <Card key={amenity.id} className="border-2 hover:border-purple-400 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">{amenity.name}</h3>
                        {amenity.description && (
                          <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">₱{amenity.price}</p>
                        <Button
                          onClick={() => handleAddAmenity(amenity)}
                          className="bg-purple-600 hover:bg-purple-700 mt-2"
                          size="lg"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Packages */}
        {hotel.packages && hotel.packages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Packages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hotel.packages.map((pkg) => (
                <Card key={pkg.id} className="border-2 hover:border-orange-400 transition-all bg-orange-50">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{pkg.name}</h3>
                        <p className="text-sm text-gray-600 mt-2">{pkg.description}</p>
                        <div className="mt-2 text-sm">
                          <p>Included: {pkg.includedCottages.length} cottages, {pkg.includedRooms.length} rooms, {pkg.includedAmenities.length} amenities</p>
                          {pkg.includedAdultEntranceFee && <p>✓ Adult entrance fee included</p>}
                          {pkg.includedChildEntranceFee && <p>✓ Child entrance fee included</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-2xl font-bold text-orange-600">₱{pkg.price}</p>
                      <Button
                        onClick={() => handleAddPackage(pkg)}
                        className="bg-orange-600 hover:bg-orange-700"
                        size="lg"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Package
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Order</h2>
                <Button onClick={() => setShowCart(false)} variant="outline" size="lg">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">Your order is empty</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, index) => (
                      <Card key={index} className="border-2">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-bold">{item.name}</h3>
                              {item.rateType && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {item.rateType} rate
                                </Badge>
                              )}
                              <p className="text-lg font-bold text-blue-600 mt-1">
                                ₱{item.price} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                variant="outline"
                                size="sm"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-xl font-bold w-8 text-center">{item.quantity}</span>
                              <Button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                variant="outline"
                                size="sm"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => removeFromCart(index)}
                                variant="destructive"
                                size="sm"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 text-right">
                            <p className="text-xl font-bold">₱{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-gray-100 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">Total:</span>
                      <span className="text-3xl font-bold text-blue-600">₱{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => {
                        setShowCart(false);
                        setShowOrderSummary(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Review Order
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCart(false);
                        setCart([]);
                      }}
                      variant="outline"
                      className="w-full py-4 text-lg"
                    >
                      Clear Order
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Modal */}
      {showOrderSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Order Summary</h2>
                <Button onClick={() => setShowOrderSummary(false)} variant="outline" size="lg">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-2">{hotel.name}</h3>
                <p className="text-gray-600">{hotel.city}, {hotel.country}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Rate Type: <span className="font-bold">{selectedRateType === "day" ? "Day Rate" : "Night Rate"}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Guests: <span className="font-bold">{adultCount} adults, {childCount} children</span>
                </p>
                <p className="text-sm text-gray-500">
                  Order Time: <span className="font-bold">{new Date().toLocaleString()}</span>
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        ₱{item.price} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold">₱{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-3xl font-bold">Total Amount:</span>
                  <span className="text-4xl font-bold text-green-600">₱{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold mb-2">Next Steps:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Take this order summary to the front desk</li>
                  <li>Present your order to the resort staff</li>
                  <li>Complete payment at the front desk</li>
                  <li>Receive your receipt and enjoy your stay!</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePrintOrder}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Print Order
                </Button>
                <Button
                  onClick={() => {
                    setShowOrderSummary(false);
                    setCart([]);
                  }}
                  variant="outline"
                  className="w-full py-4 text-lg"
                >
                  Start New Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KioskMode;
