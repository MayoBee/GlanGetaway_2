// Local storage utility for persisting units data when backend doesn't handle it properly

interface UnitsData {
  [hotelId: string]: {
    rooms?: Array<{ id: string; units: number }>;
    cottages?: Array<{ id: string; units: number }>;
    amenities?: Array<{ id: string; units: number }>;
  };
}

const UNITS_STORAGE_KEY = 'hotel_units_data';

export const saveUnitsData = (hotelId: string, unitsData: {
  rooms?: Array<{ id: string; units: number }>;
  cottages?: Array<{ id: string; units: number }>;
  amenities?: Array<{ id: string; units: number }>;
}) => {
  try {
    const existingData: UnitsData = JSON.parse(localStorage.getItem(UNITS_STORAGE_KEY) || '{}');
    existingData[hotelId] = unitsData;
    localStorage.setItem(UNITS_STORAGE_KEY, JSON.stringify(existingData));
    console.log('=== UNITS STORAGE: Saved units data for hotel', hotelId, unitsData);
  } catch (error) {
    console.error('=== UNITS STORAGE: Error saving units data', error);
  }
};

export const getUnitsData = (hotelId: string): {
  rooms?: Array<{ id: string; units: number }>;
  cottages?: Array<{ id: string; units: number }>;
  amenities?: Array<{ id: string; units: number }>;
} => {
  try {
    const data: UnitsData = JSON.parse(localStorage.getItem(UNITS_STORAGE_KEY) || '{}');
    console.log('=== UNITS STORAGE: Retrieved units data for hotel', hotelId, data[hotelId]);
    return data[hotelId] || {};
  } catch (error) {
    console.error('=== UNITS STORAGE: Error retrieving units data', error);
    return {};
  }
};

export const mergeUnitsWithBackendData = (hotelId: string, backendData: any): any => {
  const savedUnits = getUnitsData(hotelId);
  
  if (!savedUnits || (!savedUnits.rooms && !savedUnits.cottages && !savedUnits.amenities)) {
    console.log('=== UNITS STORAGE: No saved units data found, using backend data as-is');
    return backendData;
  }

  const mergedData = { ...backendData };

  // Merge rooms units
  if (savedUnits.rooms && backendData.rooms) {
    mergedData.rooms = backendData.rooms.map((room: any) => {
      const savedRoom = savedUnits.rooms?.find(r => r.id === room.id);
      return savedRoom ? { ...room, units: savedRoom.units } : room;
    });
  }

  // Merge cottages units
  if (savedUnits.cottages && backendData.cottages) {
    mergedData.cottages = backendData.cottages.map((cottage: any) => {
      const savedCottage = savedUnits.cottages?.find(c => c.id === cottage.id);
      return savedCottage ? { ...cottage, units: savedCottage.units } : cottage;
    });
  }

  // Merge amenities units
  if (savedUnits.amenities && backendData.amenities) {
    mergedData.amenities = backendData.amenities.map((amenity: any) => {
      const savedAmenity = savedUnits.amenities?.find(a => a.id === amenity.id);
      return savedAmenity ? { ...amenity, units: savedAmenity.units } : amenity;
    });
  }

  console.log('=== UNITS STORAGE: Merged backend data with saved units', {
    hotelId,
    savedUnits,
    mergedRooms: mergedData.rooms?.map((r: any) => ({ id: r.id, units: r.units })),
    mergedCottages: mergedData.cottages?.map((c: any) => ({ id: c.id, units: c.units })),
    mergedAmenities: mergedData.amenities?.map((a: any) => ({ id: a.id, units: a.units }))
  });

  return mergedData;
};

export const extractUnitsFromFormData = (formData: any, hotelId?: string): {
  rooms?: Array<{ id: string; units: number }>;
  cottages?: Array<{ id: string; units: number }>;
  amenities?: Array<{ id: string; units: number }>;
} => {
  const unitsData = {
    rooms: formData.rooms?.map((room: any) => ({ id: room.id, units: parseInt(String(room.units)) || 1 })),
    cottages: formData.cottages?.map((cottage: any) => ({ id: cottage.id, units: parseInt(String(cottage.units)) || 1 })),
    amenities: formData.amenities?.map((amenity: any) => ({ id: amenity.id, units: parseInt(String(amenity.units)) || 1 }))
  };

  console.log('=== UNITS STORAGE: Extracted units from form data', unitsData);

  if (hotelId) {
    saveUnitsData(hotelId, unitsData);
  }

  return unitsData;
};
