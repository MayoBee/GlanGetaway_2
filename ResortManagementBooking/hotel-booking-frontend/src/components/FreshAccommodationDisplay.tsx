import { HotelType } from "../../../shared/types";
import { Bed, Home, Users, Plus, Minus, Package, Check } from "lucide-react";
import { useBookingSelection } from "../contexts/BookingSelectionContext";
import { mergeUnitsWithBackendData } from "../utils/unitsStorage";

type Props = {
  hotel: HotelType;
  selectedRateType?: 'day' | 'night';
};

const FreshAccommodationDisplay = ({ hotel, selectedRateType = 'night' }: Props) => {
  const { 
    addRoom, 
    removeRoom, 
    addCottage, 
    removeCottage, 
    addPackage,
    removePackage,
    updateRoomUnits,
    updateCottageUnits,
    updateAmenityUnits,
    isRoomSelected, 
    isCottageSelected,
    isPackageSelected,
    isAmenitySelected,
    addAmenity,
    removeAmenity,
    selectedPackages,
    selectedRooms,
    selectedCottages,
    selectedAmenities,
    numberOfNights 
  } = useBookingSelection();

  // Merge backend data with saved units data
  const mergedHotel = mergeUnitsWithBackendData(hotel._id, hotel);

  // Get rooms and cottages from merged hotel data
  const rooms = mergedHotel?.rooms || [];
  const cottages = mergedHotel?.cottages || [];
  const packages = mergedHotel?.packages || [];
  const amenities = mergedHotel?.amenities || [];

  // Check if any amenity is included in a selected package
  const isAmenityInPackage = (amenityId: string) => {
    return selectedPackages.some(pkg => 
      pkg.includedAmenities && pkg.includedAmenities.some(amenity => amenity.id === amenityId)
    );
  };
  
  // Fix cottage data: automatically set hasDayRate/hasNightRate based on rate values
  const fixedCottages = cottages.map((cottage: any) => ({
    ...cottage,
    hasDayRate: cottage.hasDayRate || (cottage.dayRate && cottage.dayRate > 0),
    hasNightRate: cottage.hasNightRate || (cottage.nightRate && cottage.nightRate > 0)
  }));
  
  // TEMPORARY: Add test data to debug display issue
  const testCottages = [
    {
      id: "test-1",
      name: "Test Cottage",
      type: "Beach Villa",
      hasDayRate: true,
      hasNightRate: true,
      dayRate: 100,
      nightRate: 200,
      minOccupancy: 1,
      maxOccupancy: 3,
      description: "Test cottage for debugging"
    }
  ];
  
  // Use fixed cottages data
  const cottagesToDisplay = fixedCottages.length > 0 ? fixedCottages : testCottages;
  
  const hasRooms = rooms.length > 0;
  const hasCottages = cottages.length > 0;
  const hasPackages = packages.length > 0;

  console.log('=== FRESH ACCOMMODATION DEBUG ===');
  console.log('Hotel data:', hotel);
  console.log('Rooms found:', rooms);
  console.log('Cottages found:', cottages);
  console.log('Fixed cottages:', fixedCottages);
  console.log('Packages found:', packages);
  console.log('Has rooms:', hasRooms);
  console.log('Has cottages:', hasCottages);
  console.log('Has packages:', hasPackages);
  console.log('Selected rate type:', selectedRateType);
  
  // Debug cottage data specifically
  cottagesToDisplay.forEach((cottage: any, index: any) => {
    console.log(`Cottage ${index} details:`, {
      id: cottage.id,
      name: cottage.name,
      hasDayRate: cottage.hasDayRate,
      hasNightRate: cottage.hasNightRate,
      dayRate: cottage.dayRate,
      nightRate: cottage.nightRate
    });
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Accommodation</h2>
        <p className="text-gray-600">
          Select rooms, cottages, or packages for your perfect stay
        </p>
      </div>

      {/* Special Packages Section */}
      {hasPackages && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-purple-200">
          <div className="flex items-center mb-4">
            <Package className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">Special Packages</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg: any) => {
              const isSelected = isPackageSelected(pkg.id);
              const totalPrice = pkg.price * numberOfNights;
              
              return (
                <div 
                  key={pkg.id}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-lg ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Package Image */}
                    {pkg.imageUrl && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={pkg.imageUrl}
                          alt={pkg.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Package Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{pkg.name}</h4>
                        <p className="text-sm text-gray-600">{pkg.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">₱{pkg.price}</p>
                        <p className="text-sm text-gray-500">per night</p>
                      </div>
                    </div>

                    {/* Package Contents */}
                    <div className="space-y-2">
                      {pkg.includedRooms && pkg.includedRooms.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Rooms:</span>
                          <div className="ml-2">
                            {pkg.includedRooms.map((roomId: string) => {
                              const room = rooms.find((r: any) => r.id === roomId);
                              return room ? (
                                <div key={roomId} className="flex items-center text-gray-600">
                                  <Check className="w-3 h-3 mr-1 text-green-500" />
                                  {room.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {pkg.includedCottages && pkg.includedCottages.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Cottages:</span>
                          <div className="ml-2">
                            {pkg.includedCottages.map((cottageId: string) => {
                              const cottage = cottages.find((c: any) => c.id === cottageId);
                              return cottage ? (
                                <div key={cottageId} className="flex items-center text-gray-600">
                                  <Check className="w-3 h-3 mr-1 text-green-500" />
                                  {cottage.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {pkg.includedAmenities && pkg.includedAmenities.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Amenities:</span>
                          <div className="ml-2">
                            {pkg.includedAmenities.map((amenityId: string) => {
                              const amenity = hotel.amenities?.find((a: any) => a.id === amenityId);
                              return amenity ? (
                                <div key={amenityId} className="flex items-center text-gray-600">
                                  <Check className="w-3 h-3 mr-1 text-green-500" />
                                  {amenity.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Entrance Fees */}
                      {(pkg.includedAdultEntranceFee || pkg.includedChildEntranceFee) && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">🎫 Entrance Fees (Included):</span>
                          <div className="ml-2">
                            {pkg.includedAdultEntranceFee && (
                              <div className="flex items-center text-gray-600">
                                <Check className="w-3 h-3 mr-1 text-green-500" />
                                Adult Entrance Fee (FREE with package)
                              </div>
                            )}
                            {pkg.includedChildEntranceFee && (
                              <div className="flex items-center text-gray-600">
                                <Check className="w-3 h-3 mr-1 text-green-500" />
                                Child Entrance Fee (FREE with package)
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total Price */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total ({numberOfNights} nights):</span>
                        <span className="text-xl font-bold text-purple-600">₱{totalPrice}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      {isSelected ? (
                        <button
                          onClick={() => removePackage(pkg.id)}
                          className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4 mr-1" />
                          Remove Package
                        </button>
                      ) : (
                        <button
                          onClick={() => addPackage({
                            id: pkg.id,
                            name: pkg.name,
                            description: pkg.description,
                            price: pkg.price,
                            includedCottages: pkg.includedCottages.map((cottageId: string) => {
                              const cottage = cottages.find((c: any) => c.id === cottageId);
                              return cottage || {
                                id: cottageId,
                                name: cottageId,
                                type: "",
                                pricePerNight: 0,
                                dayRate: 0,
                                nightRate: 0,
                                hasDayRate: false,
                                hasNightRate: false,
                                maxOccupancy: 1
                              };
                            }),
                            includedRooms: pkg.includedRooms.map((roomId: string) => {
                              const room = rooms.find((r: any) => r.id === roomId);
                              return room || {
                                id: roomId,
                                name: roomId,
                                type: "",
                                pricePerNight: 0,
                                maxOccupancy: 1
                              };
                            }),
                            includedAmenities: pkg.includedAmenities.map((amenityId: string) => {
                              const amenity = hotel.amenities?.find((a: any) => a.id === amenityId);
                              return amenity || {
                                id: amenityId,
                                name: amenityId,
                                price: 0
                              };
                            }),
                            includedAdultEntranceFee: pkg.includedAdultEntranceFee || false,
                            includedChildEntranceFee: pkg.includedChildEntranceFee || false,
                          })}
                          className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Package
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

      {/* Rooms Section */}
      {hasRooms && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <Bed className="w-6 h-6 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-800">Available Rooms</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room: any) => {
              const isSelected = isRoomSelected(room.id);
              const selectedRoom = selectedRooms.find(r => r.id === room.id);
              const currentUnits = selectedRoom?.units || 1;
              const totalPrice = room.pricePerNight * currentUnits * numberOfNights;
              
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
                    {/* Room Image */}
                    {room.imageUrl && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
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

                    {/* Occupancy Range */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{room.minOccupancy} - {room.maxOccupancy} people</span>
                    </div>

                    {/* Description */}
                    {room.description && (
                      <p className="text-sm text-gray-600">{room.description}</p>
                    )}

                    {/* Unit Selection */}
                    {isSelected && (
                      <div className="border-t pt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Number of Units
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateRoomUnits(room.id, Math.max(1, currentUnits - 1))}
                            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            disabled={currentUnits <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={room.units || 1}
                            value={currentUnits}
                            onChange={(e) => {
                              const units = Math.max(1, Math.min(room.units || 1, parseInt(e.target.value) || 1));
                              updateRoomUnits(room.id, units);
                            }}
                            className="w-16 text-center border rounded px-2 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => updateRoomUnits(room.id, Math.min(room.units || 1, currentUnits + 1))}
                            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            disabled={currentUnits >= (room.units || 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-500 ml-2">
                            Available: {room.units || 1}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Total Price */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total ({numberOfNights} nights × {currentUnits} units):</span>
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
                          Remove Room
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
            <h3 className="text-xl font-semibold text-gray-800">Available Cottages</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cottagesToDisplay.map((cottage: any) => {
              const isSelected = isCottageSelected(cottage.id);
              const selectedCottage = selectedCottages.find(c => c.id === cottage.id);
              const currentUnits = selectedCottage?.units || 1;
              
              // Always show both day and night rates when available
              let cottagePrice = 0;
              let rateDisplay = null;
/* ... */
              // Determine which price to use for calculation based on selected rate type
              if (selectedRateType === 'day' && cottage.hasDayRate && cottage.dayRate) {
                cottagePrice = cottage.dayRate;
              } else if (selectedRateType === 'night' && cottage.hasNightRate && cottage.nightRate) {
                cottagePrice = cottage.nightRate;
              }
              
              // Always show both rates if available
              rateDisplay = (
                <div className="space-y-2">
                  {cottage.hasDayRate && cottage.dayRate && (
                    <div className={`flex items-center justify-between p-3 border rounded ${
                      selectedRateType === 'day' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRateType === 'day'} 
                          readOnly 
                          className="w-4 h-4 text-green-600 border-green-300 rounded mr-2" 
                        />
                        <span className={`font-semibold ${
                          selectedRateType === 'day' ? 'text-green-800' : 'text-gray-600'
                        }`}>Day Rate</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        selectedRateType === 'day' ? 'text-green-600' : 'text-gray-600'
                      }`}>₱{cottage.dayRate}</span>
                    </div>
                  )}
                  {cottage.hasNightRate && cottage.nightRate && (
                    <div className={`flex items-center justify-between p-3 border rounded ${
                      selectedRateType === 'night' 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRateType === 'night'} 
                          readOnly 
                          className="w-4 h-4 text-blue-600 border-blue-300 rounded mr-2" 
                        />
                        <span className={`font-semibold ${
                          selectedRateType === 'night' ? 'text-blue-800' : 'text-gray-600'
                        }`}>Night Rate</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        selectedRateType === 'night' ? 'text-blue-600' : 'text-gray-600'
                      }`}>₱{cottage.nightRate}</span>
                    </div>
                  )}
                  {!cottage.hasDayRate && !cottage.hasNightRate && (
                    <div className="text-center text-gray-500 p-3 border border-gray-200 rounded bg-gray-50">
                      <span className="text-sm">No rates available</span>
                    </div>
                  )}
                </div>
              );
              
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
                    {/* Cottage Image */}
                    {cottage.imageUrl && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={cottage.imageUrl}
                          alt={cottage.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Cottage Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{cottage.name}</h4>
                        <p className="text-sm text-gray-600">{cottage.type}</p>
                      </div>
                    </div>

                    {/* Occupancy Range */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{cottage.minOccupancy} - {cottage.maxOccupancy} people</span>
                    </div>

                    {/* Description */}
                    {cottage.description && (
                      <p className="text-sm text-gray-600">{cottage.description}</p>
                    )}

                    {/* Rate Display */}
                    {rateDisplay}

                    {/* Unit Selection */}
                    {isSelected && (
                      <div className="border-t pt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Number of Units
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCottageUnits(cottage.id, Math.max(1, currentUnits - 1))}
                            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            disabled={currentUnits <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={cottage.units || 1}
                            value={currentUnits}
                            onChange={(e) => {
                              const units = Math.max(1, Math.min(cottage.units || 1, parseInt(e.target.value) || 1));
                              updateCottageUnits(cottage.id, units);
                            }}
                            className="w-16 text-center border rounded px-2 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => updateCottageUnits(cottage.id, Math.min(cottage.units || 1, currentUnits + 1))}
                            className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                            disabled={currentUnits >= (cottage.units || 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-sm text-gray-500 ml-2">
                            Available: {cottage.units || 1}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Total Price */}
                    {cottagePrice > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Total ({numberOfNights} nights × {currentUnits} units):</span>
                          <span className="text-xl font-bold text-green-600">₱{cottagePrice * currentUnits * numberOfNights}</span>
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
                            Remove Cottage
                          </button>
                        ) : (
                          <button
                            onClick={() => addCottage({
                              id: cottage.id,
                              name: cottage.name,
                              type: cottage.type,
                              pricePerNight: cottagePrice,
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
                    
                    {/* Show message when no rate is available for selected type */}
                    {cottagePrice === 0 && (cottage.hasDayRate || cottage.hasNightRate) && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 text-center">
                          {selectedRateType === 'day' && !cottage.hasDayRate 
                            ? 'Day rate not available for this cottage' 
                            : selectedRateType === 'night' && !cottage.hasNightRate 
                            ? 'Night rate not available for this cottage'
                            : 'Please select a rate type to book this cottage'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Amenities & Activities */}
      {amenities && amenities.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-xl font-semibold mb-3">Amenities & Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map((amenity: any) => {
              const isSelected = isAmenitySelected(amenity.id);
              const isInPackage = isAmenityInPackage(amenity.id);
              const isDisabled = isInPackage && !isSelected;
              const selectedAmenity = selectedAmenities.find(a => a.id === amenity.id);
              const currentUnits = selectedAmenity?.units || 1;
              
              return (
                <div
                  key={amenity.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : isDisabled
                        ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                  }`}
                >
                  {/* Amenity Image */}
                  {amenity.imageUrl && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={amenity.imageUrl}
                        alt={amenity.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{amenity.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">
                        ₱{amenity.price}
                      </span>
                      {isSelected && (
                        <div className="bg-blue-600 text-white p-1 rounded-full">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      {isInPackage && !isSelected && (
                        <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                          In Package
                        </div>
                      )}
                    </div>
                  </div>
                  {amenity.description && (
                    <p className="text-sm text-gray-600 mb-3">{amenity.description}</p>
                  )}
                  
                  {/* Unit Selection */}
                  {isSelected && (
                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Number of Units
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateAmenityUnits(amenity.id, Math.max(1, currentUnits - 1))}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          disabled={currentUnits <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={amenity.units || 1}
                          value={currentUnits}
                          onChange={(e) => {
                            const units = Math.max(1, Math.min(amenity.units || 1, parseInt(e.target.value) || 1));
                            updateAmenityUnits(amenity.id, units);
                          }}
                          className="w-16 text-center border rounded px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => updateAmenityUnits(amenity.id, Math.min(amenity.units || 1, currentUnits + 1))}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          disabled={currentUnits >= (amenity.units || 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-500 ml-2">
                          Available: {amenity.units || 1}
                        </span>
                      </div>
                    </div>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        if (isSelected) {
                          removeAmenity(amenity.id);
                        } else {
                          addAmenity({
                            id: amenity.id,
                            name: amenity.name,
                            price: amenity.price,
                            units: 1,
                            description: amenity.description
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
          {amenities.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No amenities available for this hotel.
            </div>
          )}
        </div>
      )}

      {/* No Accommodations Message */}
      {!hasRooms && !hasCottages && !hasPackages && (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
            <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Accommodations Available</h3>
            <p className="text-gray-600">
              This resort hasn't added any rooms, cottages, or packages yet. Check back later or contact resort directly.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshAccommodationDisplay;
