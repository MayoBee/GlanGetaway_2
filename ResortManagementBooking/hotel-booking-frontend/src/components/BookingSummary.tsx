import { useBookingSelection } from "../contexts/BookingSelectionContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bed, Home, Star, DollarSign, X } from "lucide-react";

const BookingSummary = () => {
  const {
    selectedRooms,
    selectedCottages,
    selectedAmenities,
    basePrice,
    accommodationTotal,
    amenitiesTotal,
    totalCost,
    numberOfNights,
    removeRoom,
    removeCottage,
    removeAmenity,
    clearSelections,
  } = useBookingSelection();

  const hasSelections = selectedRooms.length > 0 || selectedCottages.length > 0 || selectedAmenities.length > 0;

  if (!hasSelections) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-6">
            <p>No accommodations or amenities selected yet.</p>
            <p className="text-sm mt-2">Select rooms, cottages, or amenities to see your booking summary.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Booking Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Price */}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-gray-700 font-medium">Base Resort Price</span>
          <span className="text-lg font-bold text-gray-900">
            ₱{basePrice.toLocaleString()}
          </span>
        </div>

        {/* Selected Rooms */}
        {selectedRooms.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bed className="w-4 h-4 text-blue-600" />
              Selected Rooms ({selectedRooms.length})
            </h4>
            {selectedRooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{room.name}</span>
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                      {room.type}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    ₱{room.pricePerNight} × {numberOfNights} night{numberOfNights > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-blue-600">
                    ₱{(room.pricePerNight * numberOfNights).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Cottages */}
        {selectedCottages.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4 text-green-600" />
              Selected Cottages ({selectedCottages.length})
            </h4>
            {selectedCottages.map((cottage) => (
              <div key={cottage.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{cottage.name}</span>
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                      {cottage.type}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    ₱{cottage.pricePerNight} × {numberOfNights} night{numberOfNights > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-600">
                    ₱{(cottage.pricePerNight * numberOfNights).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeCottage(cottage.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Amenities */}
        {selectedAmenities.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              Selected Amenities ({selectedAmenities.length})
            </h4>
            {selectedAmenities.map((amenity) => (
              <div key={amenity.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{amenity.name}</span>
                  {amenity.description && (
                    <div className="text-sm text-gray-600 mt-1">{amenity.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-yellow-600">
                    ₱{amenity.price.toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeAmenity(amenity.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Resort Price</span>
            <span className="font-medium">₱{basePrice.toLocaleString()}</span>
          </div>
          {accommodationTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Accommodation Total</span>
              <span className="font-medium">₱{accommodationTotal.toLocaleString()}</span>
            </div>
          )}
          {amenitiesTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amenities Total</span>
              <span className="font-medium">₱{amenitiesTotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t">
            <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Total Cost
            </span>
            <span className="text-2xl font-bold text-green-600">
              ₱{totalCost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button 
            onClick={clearSelections}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Clear All
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSummary;
