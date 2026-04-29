export const mergeUnitsWithBackendData = (hotelId: string, hotel: any) => {
  // Load saved units from localStorage for this hotel
  const savedUnits = loadUnitsFromStorage();
  const hotelSavedUnits = savedUnits.filter((u: any) => u.hotelId === hotelId);
  
  // Merge saved units with backend data
  const mergeArray = (backendArray: any[], savedArray: any[]) => {
    if (!backendArray) return [];
    return backendArray.map((item: any) => {
      const saved = savedArray.find((s: any) => s.id === item.id);
      return saved ? { ...item, ...saved } : item;
    });
  };
  
  return {
    ...hotel,
    rooms: mergeArray(hotel.rooms, hotelSavedUnits.filter((u: any) => u.type === 'room')),
    cottages: mergeArray(hotel.cottages, hotelSavedUnits.filter((u: any) => u.type === 'cottage')),
    amenities: mergeArray(hotel.amenities, hotelSavedUnits.filter((u: any) => u.type === 'amenity')),
  };
};

export const saveUnitsToStorage = (units: any[]) => {
  localStorage.setItem('units', JSON.stringify(units));
};

export const loadUnitsFromStorage = () => {
  const stored = localStorage.getItem('units');
  return stored ? JSON.parse(stored) : [];
};
