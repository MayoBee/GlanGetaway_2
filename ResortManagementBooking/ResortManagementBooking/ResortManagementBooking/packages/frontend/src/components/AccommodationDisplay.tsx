import { HotelType } from "../../../shared/types";
import { Bed, Home, Users, DollarSign, Plus } from "lucide-react";
import { useBookingSelection } from "../contexts/BookingSelectionContext";

type Props = {
  hotel: HotelType;
  selectedRateType?: 'day' | 'night';
};

const AccommodationDisplay = ({ hotel, selectedRateType = 'night' }: Props) => {
  // Handle different possible data structures
  const rooms = hotel.rooms || [];
  const cottages = hotel.cottages || [];
  
  const hasRooms = rooms.length > 0;
  const hasCottages = cottages.length > 0;
  
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

  // Check if any room/cottage is included in a selected package
  const isRoomInPackage = (roomId: string) => {
    return selectedPackages.some(pkg => 
      pkg.includedRooms && pkg.includedRooms.some(room => room.id === roomId)
    );
  };

  const isCottageInPackage = (cottageId: string) => {
    return selectedPackages.some(pkg => 
      pkg.includedCottages && pkg.includedCottages.some(cottage => cottage.id === cottageId)
    );
  };

  if (!hasRooms && !hasCottages) {
    return (
      <div className="border border-slate-300 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Rooms & Cottages</h3>
        <div className="text-center text-gray-500 py-8">
          <p>No rooms or cottages have been added to this resort yet.</p>
          <p className="text-sm mt-2">Contact the resort owner for more accommodation options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rooms Section */}
      {hasRooms && (
        <div className="border border-slate-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bed className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Available Rooms</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotel.rooms?.map((room) => {
              const isSelected = isRoomSelected(room.id);
              const isInPackage = isRoomInPackage(room.id);
              const isDisabled = isInPackage && !isSelected;
              
              return (
                <div
                  key={room.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : isDisabled
                        ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{room.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {room.type}
                      </span>
                      {isInPackage && !isSelected && (
                        <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                          In Package
                        </div>
                      )}
                  </div>
                </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          ₱{room.pricePerNight}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">per night</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {room.minOccupancy} - {room.maxOccupancy} people
                      </span>
                    </div>

                    {numberOfNights > 1 && (
                      <div className="text-sm text-blue-600 font-medium">
                        Total: ₱{room.pricePerNight * numberOfNights} ({numberOfNights} nights)
                      </div>
                    )}
                  </div>
                  
                  {room.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  
                  <button
                    className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm ${
                      isDisabled
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : isSelected
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        if (isSelected) {
                          removeRoom(room.id);
                        } else {
                          addRoom({
                            id: room.id,
                            name: room.name,
                            type: room.type,
                            pricePerNight: room.pricePerNight,
                            maxOccupancy: room.maxOccupancy,
                            units: 1,
                            description: room.description
                          });
                        }
                      }
                    }}
                  >
                    {isSelected ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Remove</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Add to Booking</span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cottages Section */}
      {hasCottages && (
        <div className="border border-slate-300 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Home className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold">Available Cottages</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotel.cottages?.map((cottage) => {
              const isSelected = isCottageSelected(cottage.id);
              const isInPackage = isCottageInPackage(cottage.id);
              const isDisabled = isInPackage && !isSelected;
              
              return (
                <div
                  key={cottage.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                    isSelected 
                      ? 'border-green-500 bg-green-50 shadow-md' 
                      : isDisabled
                        ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-green-300 cursor-pointer'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-900">{cottage.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                        {cottage.type}
                      </span>
                      {isInPackage && !isSelected && (
                        <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                          In Package
                        </div>
                      )}
                  </div>
                </div>
                  
                  <div className="space-y-2 mb-3">
                    {/* Day Rate - Only show if selectedRateType is 'day' and cottage has day rate */}
                    {selectedRateType === 'day' && cottage.hasDayRate && (
                      <div className="flex items-center justify-between p-2 border border-green-200 rounded bg-green-50">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            className="w-4 h-4 text-green-600 border-green-300 rounded"
                          />
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span className="text-lg font-bold text-green-600">
                              ₱{cottage.dayRate}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-green-600 font-medium">day rate</span>
                      </div>
                    )}
                    
                    {/* Night Rate - Only show if selectedRateType is 'night' and cottage has night rate */}
                    {selectedRateType === 'night' && cottage.hasNightRate && (
                      <div className="flex items-center justify-between p-2 border border-blue-200 rounded bg-blue-50">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={true}
                            readOnly
                            className="w-4 h-4 text-blue-600 border-blue-300 rounded"
                          />
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-600">
                              ₱{cottage.nightRate}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">night rate</span>
                      </div>
                    )}

                    {/* Occupancy Range */}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {cottage.minOccupancy} - {cottage.maxOccupancy} people
                      </span>
                    </div>

                    {/* Total calculation based on selected rate */}
                    {numberOfNights > 1 && (
                      <div className="text-sm text-green-600 font-medium">
                        Total: ₱{(selectedRateType === 'day' ? cottage.dayRate : cottage.nightRate) * numberOfNights} ({numberOfNights} nights)
                      </div>
                    )}
                  </div>
                  
                  {cottage.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {cottage.description}
                    </p>
                  )}
                  
                  <button
                    className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 font-medium text-sm ${
                      isDisabled
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : isSelected
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        if (isSelected) {
                          removeCottage(cottage.id);
                        } else {
                          addCottage({
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
                          });
                        }
                      }
                    }}
                  >
                    {isSelected ? (
                      <div className="flex items-center justify-center gap-2">
                        <span>Remove</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>Add to Booking</span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccommodationDisplay;
