import { HotelType } from "../../../shared/types";
import { Bed, Home, Users, DollarSign, Plus, Minus } from "lucide-react";
import { useBookingSelection } from "../contexts/BookingSelectionContext";

type Props = {
  hotel: HotelType;
  selectedRateType?: 'day' | 'night';
};

const NewAccommodationDisplay = ({ hotel, selectedRateType = 'night' }: Props) => {
  const { 
    addRoom, 
    removeRoom, 
    addCottage, 
    removeCottage, 
    isRoomSelected, 
    isCottageSelected,
    selectedPackages,
    numberOfNights 
  } = useBookingSelection();

  // Get rooms and cottages from hotel data
  const rooms = hotel?.rooms || [];
  const cottages = hotel?.cottages || [];
  
  const hasRooms = rooms.length > 0;
  const hasCottages = cottages.length > 0;

  console.log('NewAccommodationDisplay - rooms:', rooms);
  console.log('NewAccommodationDisplay - cottages:', cottages);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Rooms & Cottages</h2>
        <p className="text-gray-600">
          Choose your perfect accommodation for your stay
        </p>
      </div>

      {/* Rooms Section */}
      {hasRooms && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Bed className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">Rooms</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const isSelected = isRoomSelected(room.id);
              const totalPrice = room.pricePerNight * numberOfNights;
              
              return (
                <div 
                  key={room.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Room Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{room.name}</h4>
                        <p className="text-sm text-gray-600">{room.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">₱{room.pricePerNight}</p>
                        <p className="text-sm text-gray-500">per night</p>
                      </div>
                    </div>

                    {/* Occupancy */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{room.minOccupancy} - {room.maxOccupancy} people</span>
                    </div>

                    {/* Description */}
                    {room.description && (
                      <p className="text-sm text-gray-600">{room.description}</p>
                    )}

                    {/* Total Price */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total ({numberOfNights} nights):</span>
                        <span className="text-xl font-bold text-green-600">₱{totalPrice}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {isSelected ? (
                        <button
                          onClick={() => removeRoom(room.id)}
                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => addRoom({...room, units: 1})}
                          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Room
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cottages Section */}
      {hasCottages && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center mb-4">
            <Home className="w-6 h-6 text-green-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">Cottages</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cottages.map((cottage) => {
              const isSelected = isCottageSelected(cottage.id);
              
              // Calculate price based on selected rate type
              let cottagePrice = 0;
              let rateDisplay = null;
              
              if (selectedRateType === 'day' && cottage.hasDayRate && cottage.dayRate) {
                cottagePrice = cottage.dayRate;
                rateDisplay = (
                  <div className="flex items-center justify-between p-2 border border-green-200 rounded bg-green-50">
                    <input type="checkbox" checked readOnly className="w-4 h-4 text-green-600 border-green-300 rounded" />
                    <span className="font-semibold">₱{cottage.dayRate}</span>
                    <span className="text-sm text-green-600 font-medium">day rate</span>
                  </div>
                );
              } else if (selectedRateType === 'night' && cottage.hasNightRate && cottage.nightRate) {
                cottagePrice = cottage.nightRate;
                rateDisplay = (
                  <div className="flex items-center justify-between p-2 border border-blue-200 rounded bg-blue-50">
                    <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-600 border-blue-300 rounded" />
                    <span className="font-semibold">₱{cottage.nightRate}</span>
                    <span className="text-sm text-blue-600 font-medium">night rate</span>
                  </div>
                );
              }

              const totalPrice = cottagePrice * numberOfNights;
              
              return (
                <div 
                  key={cottage.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Cottage Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{cottage.name}</h4>
                        <p className="text-sm text-gray-600">{cottage.type}</p>
                      </div>
                      <div className="text-right">
                        {rateDisplay}
                      </div>
                    </div>

                    {/* Occupancy */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{cottage.minOccupancy} - {cottage.maxOccupancy} people</span>
                    </div>

                    {/* Description */}
                    {cottage.description && (
                      <p className="text-sm text-gray-600">{cottage.description}</p>
                    )}

                    {/* Total Price */}
                    {cottagePrice > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total ({numberOfNights} nights):</span>
                          <span className="text-xl font-bold text-green-600">₱{totalPrice}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {cottagePrice > 0 && (
                      <div className="flex gap-2 mt-4">
                        {isSelected ? (
                          <button
                            onClick={() => removeCottage(cottage.id)}
                            className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4 mr-1" />
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => addCottage({
                              id: cottage.id,
                              name: cottage.name,
                              type: cottage.type,
                              pricePerNight: selectedRateType === 'day' ? cottage.dayRate : cottage.nightRate,
                              dayRate: cottage.dayRate,
                              nightRate: cottage.nightRate,
                              hasDayRate: cottage.hasDayRate,
                              hasNightRate: cottage.hasNightRate,
                              maxOccupancy: cottage.maxOccupancy,
                              units: 1,
                              description: cottage.description
                            })}
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Cottage
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No Accommodations Message */}
      {!hasRooms && !hasCottages && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accommodations Available</h3>
            <p className="text-gray-600">
              This resort hasn't added any rooms or cottages yet. Check back later or contact the resort directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewAccommodationDisplay;
