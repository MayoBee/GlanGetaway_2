import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, Package, Check, X, Home, Bed, Sparkles } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import ImageUpload from "../../components/ImageUpload";

interface PackageItemState {
  rooms: Map<string, { checked: boolean; units: number }>;
  cottages: Map<string, { checked: boolean; units: number }>;
  amenities: Map<string, { checked: boolean; units: number }>;
  customItems: Array<{ id: string; name: string; description: string }>;
  customRooms: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    capacity: number;
    features: string;
    availability: number;
  }>;
  customCottages: Array<{
    id: string;
    name: string;
    type: string;
    description: string;
    capacity: number;
    features: string;
    availability: number;
  }>;
  customAmenities: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    inclusionType: 'included' | 'addon';
  }>;
}

const FreshPackagesSection = () => {
  const { control } = useFormContext<HotelFormData>();
  const rooms = useWatch({ control, name: "rooms" });
  const cottages = useWatch({ control, name: "cottages" });
  const amenities = useWatch({ control, name: "amenities" });
  const adultEntranceFee = useWatch({ control, name: "adultEntranceFee" });
  const packages = useWatch({ control, name: "packages" });
  
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "packages",
  });
  const [confirmedPackages, setConfirmedPackages] = useState<Set<string>>(new Set());
  const [packageStates, setPackageStates] = useState<Map<string, PackageItemState>>(new Map());
  const isInitializingRef = useRef(false);
  const confirmedPackagesRef = useRef<Set<string>>(new Set());
  const [showCustomRoomModal, setShowCustomRoomModal] = useState<string | null>(null);
  const [showCustomCottageModal, setShowCustomCottageModal] = useState<string | null>(null);
  const [showCustomAmenityModal, setShowCustomAmenityModal] = useState<string | null>(null);

  const addPackage = () => {
    const newPackageId = `package_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPackage = {
      id: newPackageId,
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      includedRooms: [],
      includedCottages: [],
      includedAmenities: [],
      customItems: [],
      includedAdultEntranceFee: false,
      includedChildEntranceFee: false,
      isConfirmed: false,
    } as any;
    
    append(newPackage);
    
    // Initialize state for new package
    setPackageStates(prev => new Map(prev).set(newPackageId, {
      rooms: new Map(),
      cottages: new Map(),
      amenities: new Map(),
      customItems: [],
      customRooms: [],
      customCottages: [],
      customAmenities: []
    }));
  };

  // Initialize confirmed states only when component mounts or packages change significantly
  useEffect(() => {
    if (packages && !isInitializingRef.current) {
      isInitializingRef.current = true;
      
      // Only initialize if we don't have any confirmed states yet
      if (confirmedPackagesRef.current.size === 0) {
        const confirmedIds = packages
          .filter(pkg => pkg.isConfirmed)
          .map(pkg => pkg.id)
          .filter(Boolean);
        
        const newConfirmedSet = new Set(confirmedIds);
        setConfirmedPackages(newConfirmedSet);
        confirmedPackagesRef.current = newConfirmedSet;
      }
      
      // Initialize package states from existing data
      const newStates = new Map<string, PackageItemState>();
      packages.forEach(pkg => {
        const existingState = packageStates.get(pkg.id);
        if (existingState) {
          newStates.set(pkg.id, existingState);
        } else {
          const state: PackageItemState = {
            rooms: new Map(),
            cottages: new Map(),
            amenities: new Map(),
            customItems: (pkg.customItems || []).map(item => ({
            ...item,
            description: item.description || ""
          })),
          customRooms: (pkg.customRooms || []).map(r => ({ ...r })),
          customCottages: (pkg.customCottages || []).map(c => ({ ...c })),
          customAmenities: (pkg.customAmenities || []).map(a => ({ ...a }))
        };
        
        // Load existing selections with units
        pkg.includedRooms?.forEach((room: any) => {
          state.rooms.set(room.id, { checked: true, units: room.units || 1 });
        });
        
        pkg.includedCottages?.forEach((cottage: any) => {
          state.cottages.set(cottage.id, { checked: true, units: cottage.units || 1 });
        });
        
        pkg.includedAmenities?.forEach((amenity: any) => {
          state.amenities.set(amenity.id, { checked: true, units: amenity.units || 1 });
        });
        
        newStates.set(pkg.id, state);
        }
      });
      setPackageStates(newStates);
      
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [packages?.length]); // Only run when packages length changes

  const confirmPackage = useCallback((packageId: string) => {
    setConfirmedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageId)) {
        newSet.delete(packageId);
      } else {
        newSet.add(packageId);
      }
      confirmedPackagesRef.current = newSet;
      return newSet;
    });

    // Update the form data with the new confirmation state and package contents
    if (packages) {
      const packageIndex = packages.findIndex(pkg => pkg.id === packageId);
      if (packageIndex !== -1) {
        const isCurrentlyConfirmed = confirmedPackagesRef.current.has(packageId);
        const packageState = packageStates.get(packageId);
        
        if (packageState) {
          // Build the package data from state
          const allRooms = rooms || [];
          const allCottages = cottages || [];
          const allAmenities = amenities || [];
          
          const includedRooms = Array.from(packageState.rooms.entries())
            .filter(([_, state]) => state.checked)
            .map(([id, state]) => {
              const room = allRooms.find(r => r.id === id);
              return room ? {
                id: room.id,
                name: room.name,
                type: room.type,
                pricePerNight: room.pricePerNight,
                maxOccupancy: room.maxOccupancy,
                units: state.units,
                description: room.description || ""
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          const includedCottages = Array.from(packageState.cottages.entries())
            .filter(([_, state]) => state.checked)
            .map(([id, state]) => {
              const cottage = allCottages.find(c => c.id === id);
              return cottage ? {
                id: cottage.id,
                name: cottage.name,
                type: cottage.type,
                pricePerNight: cottage.pricePerNight,
                dayRate: cottage.dayRate,
                nightRate: cottage.nightRate,
                hasDayRate: cottage.hasDayRate,
                hasNightRate: cottage.hasNightRate,
                maxOccupancy: cottage.maxOccupancy,
                units: state.units,
                description: cottage.description || ""
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          const includedAmenities = Array.from(packageState.amenities.entries())
            .filter(([_, state]) => state.checked)
            .map(([id, state]) => {
              const amenity = allAmenities.find(a => a.id === id);
              return amenity ? {
                id: amenity.id,
                name: amenity.name,
                price: amenity.price,
                units: state.units,
                description: amenity.description || ""
              } : null;
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);

          update(packageIndex, {
            ...packages[packageIndex],
            isConfirmed: !isCurrentlyConfirmed,
            includedRooms: includedRooms.map(r => r.id),
            includedCottages: includedCottages.map(c => c.id),
            includedAmenities: includedAmenities.map(a => a.id),
            customItems: packageState.customItems,
            customRooms: packageState.customRooms,
            customCottages: packageState.customCottages,
            customAmenities: packageState.customAmenities
          });
        }
      }
    }
  }, [packages, packageStates, rooms, cottages, amenities, update]);

  const updatePackageState = (packageId: string, updates: Partial<PackageItemState>) => {
    setPackageStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(packageId) || {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      
      newStates.set(packageId, { ...currentState, ...updates });
      return newStates;
    });
  };

  const toggleItem = (packageId: string, itemType: 'rooms' | 'cottages' | 'amenities', itemId: string) => {
    let packageState = packageStates.get(packageId);
    
    // Initialize package state if it doesn't exist
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    const itemMap = packageState[itemType];
    const currentState = itemMap.get(itemId) || { checked: false, units: 1 };
    
    updatePackageState(packageId, {
      [itemType]: new Map(itemMap).set(itemId, {
        checked: !currentState.checked,
        units: currentState.checked ? 1 : currentState.units
      })
    });
  };

  const updateItemUnits = (packageId: string, itemType: 'rooms' | 'cottages' | 'amenities', itemId: string, units: number) => {
    let packageState = packageStates.get(packageId);
    
    // Initialize package state if it doesn't exist
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    const itemMap = packageState[itemType];
    const currentState = itemMap.get(itemId) || { checked: false, units: 1 };
    
    updatePackageState(packageId, {
      [itemType]: new Map(itemMap).set(itemId, {
        ...currentState,
        units
      })
    });
  };

  const addCustomItem = (packageId: string, name: string, description: string) => {
    let packageState = packageStates.get(packageId);
    
    // Initialize package state if it doesn't exist
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    const newItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description
    };

    updatePackageState(packageId, {
      customItems: [...packageState.customItems, newItem]
    });
  };

  const removeCustomItem = (packageId: string, customItemId: string) => {
    let packageState = packageStates.get(packageId);
    
    // Initialize package state if it doesn't exist
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    updatePackageState(packageId, {
      customItems: packageState.customItems.filter(item => item.id !== customItemId)
    });
  };

  const addCustomRoom = (packageId: string, room: {
    name: string;
    type: string;
    description: string;
    capacity: number;
    features: string;
    availability: number;
  }) => {
    let packageState = packageStates.get(packageId);
    
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    const newRoom = {
      id: `custom_room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...room
    };

    updatePackageState(packageId, {
      customRooms: [...packageState.customRooms, newRoom]
    });
  };

  const removeCustomRoom = (packageId: string, roomId: string) => {
    let packageState = packageStates.get(packageId);
    
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    updatePackageState(packageId, {
      customRooms: packageState.customRooms.filter(room => room.id !== roomId)
    });
  };

  const addCustomCottage = (packageId: string, cottage: {
    name: string;
    type: string;
    description: string;
    capacity: number;
    features: string;
    availability: number;
  }) => {
    let packageState = packageStates.get(packageId);
    
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    const newCottage = {
      id: `custom_cottage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...cottage
    };

    updatePackageState(packageId, {
      customCottages: [...packageState.customCottages, newCottage]
    });
  };

  const removeCustomCottage = (packageId: string, cottageId: string) => {
    let packageState = packageStates.get(packageId);
    
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    updatePackageState(packageId, {
      customCottages: packageState.customCottages.filter(cottage => cottage.id !== cottageId)
    });
  };

  const addCustomAmenity = (packageId: string, amenity: {
    name: string;
    description: string;
    quantity: number;
    inclusionType: 'included' | 'addon';
  }) => {
    let packageState = packageStates.get(packageId);
    
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    const newAmenity = {
      id: `custom_amenity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...amenity
    };

    updatePackageState(packageId, {
      customAmenities: [...packageState.customAmenities, newAmenity]
    });
  };

  const removeCustomAmenity = (packageId: string, amenityId: string) => {
    let packageState = packageStates.get(packageId);
    
    if (!packageState) {
      const newState: PackageItemState = {
        rooms: new Map(),
        cottages: new Map(),
        amenities: new Map(),
        customItems: [],
        customRooms: [],
        customCottages: [],
        customAmenities: []
      };
      setPackageStates(prev => new Map(prev).set(packageId, newState));
      packageState = newState;
    }

    updatePackageState(packageId, {
      customAmenities: packageState.customAmenities.filter(amenity => amenity.id !== amenityId)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Package Offers</h3>
        <button
          type="button"
          onClick={addPackage}
          className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Package
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No packages added yet</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {fields.map((field, index) => {
            const packageState = packageStates.get(field.id);
            
            return (
              <div key={field.id} className="border rounded-lg p-4 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-800">Package {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Package Image */}
                  <div className="md:col-span-2">
                    <ImageUpload
                      value={packages?.[index]?.imageUrl || ""}
                      onChange={(url: string) => {
                        if (packages) {
                          const updatedPackages = [...packages];
                          updatedPackages[index] = { ...updatedPackages[index], imageUrl: url };
                          // Update using the update method from useFieldArray
                          update(index, updatedPackages[index]);
                        }
                      }}
                      label="Package Image"
                    />
                  </div>

                  {/* Package Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Package Name
                    </label>
                    <input
                      {...control.register(`packages.${index}.name` as const)}
                      type="text"
                      placeholder="e.g., Summer Getaway Package"
                      className="w-full border rounded px-3 py-2 font-normal"
                    />
                  </div>

                  {/* Package Price */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Package Price (₱)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
                      <input
                        {...control.register(`packages.${index}.price` as const)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Total package price (overrides individual item prices)</p>
                  </div>

                  {/* Package Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Package Description
                    </label>
                    <textarea
                      {...control.register(`packages.${index}.description` as const)}
                      rows={3}
                      placeholder="Describe what this package includes..."
                      className="w-full border rounded px-3 py-2 font-normal resize-none"
                    />
                  </div>
                </div>

                {/* Inventory Items Selection */}
                <div className="mt-6 space-y-4">
                  {/* Included Rooms */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Bed className="inline w-4 h-4 mr-1" />
                      Included Rooms
                    </label>
                    {rooms && rooms.length > 0 ? (
                      <div className="space-y-2">
                        {rooms.map((room) => {
                          const roomState = packageState?.rooms.get(room.id);
                          const isChecked = roomState?.checked || false;
                          const units = roomState?.units || 1;
                          
                          return (
                            <div key={room.id} className="flex items-center gap-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(field.id, 'rooms', room.id)}
                                className="w-4 h-4"
                              />
                              <span className="flex-1 text-sm">{room.name} - ₱{room.pricePerNight}/night</span>
                              {isChecked && (
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600">Units:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={room.units || 10}
                                    value={units}
                                    onChange={(e) => updateItemUnits(field.id, 'rooms', room.id, parseInt(e.target.value) || 1)}
                                    className="w-16 text-xs border rounded px-1 py-0.5"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No rooms available. Add rooms first to include them in packages.
                      </p>
                    )}
                  </div>

                  {/* Included Cottages */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Home className="inline w-4 h-4 mr-1" />
                      Included Cottages
                    </label>
                    {cottages && cottages.length > 0 ? (
                      <div className="space-y-2">
                        {cottages.map((cottage) => {
                          const cottageState = packageState?.cottages.get(cottage.id);
                          const isChecked = cottageState?.checked || false;
                          const units = cottageState?.units || 1;
                          
                          return (
                            <div key={cottage.id} className="flex items-center gap-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(field.id, 'cottages', cottage.id)}
                                className="w-4 h-4"
                              />
                              <span className="flex-1 text-sm">{cottage.name} - ₱{cottage.pricePerNight}/night</span>
                              {isChecked && (
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600">Units:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={cottage.units || 10}
                                    value={units}
                                    onChange={(e) => updateItemUnits(field.id, 'cottages', cottage.id, parseInt(e.target.value) || 1)}
                                    className="w-16 text-xs border rounded px-1 py-0.5"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No cottages available. Add cottages first to include them in packages.
                      </p>
                    )}
                  </div>

                  {/* Included Amenities */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Included Amenities
                    </label>
                    {amenities && amenities.length > 0 ? (
                      <div className="space-y-2">
                        {amenities.map((amenity) => {
                          const amenityState = packageState?.amenities.get(amenity.id);
                          const isChecked = amenityState?.checked || false;
                          const units = amenityState?.units || 1;
                          
                          return (
                            <div key={amenity.id} className="flex items-center gap-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(field.id, 'amenities', amenity.id)}
                                className="w-4 h-4"
                              />
                              <span className="flex-1 text-sm">{amenity.name} - ₱{amenity.price}</span>
                              {isChecked && (
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600">Units:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max={amenity.units || 10}
                                    value={units}
                                    onChange={(e) => updateItemUnits(field.id, 'amenities', amenity.id, parseInt(e.target.value) || 1)}
                                    className="w-16 text-xs border rounded px-1 py-0.5"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No amenities available. Add amenities first to include them in packages.
                      </p>
                    )}
                  </div>

                  {/* Custom Items */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Sparkles className="inline w-4 h-4 mr-1" />
                      Custom Add-ons
                    </label>
                    <div className="space-y-2">
                      {packageState?.customItems.map((customItem) => (
                        <div key={customItem.id} className="flex items-center gap-2 p-2 border rounded bg-yellow-50">
                          <span className="flex-1 text-sm">
                            <strong>{customItem.name}</strong>
                            {customItem.description && <span className="text-gray-600"> - {customItem.description}</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomItem(field.id, customItem.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g., Free Entrance Fee"
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          id={`custom-name-${field.id}`}
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          className="flex-1 border rounded px-2 py-1 text-sm"
                          id={`custom-desc-${field.id}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const nameInput = document.getElementById(`custom-name-${field.id}`) as HTMLInputElement;
                            const descInput = document.getElementById(`custom-desc-${field.id}`) as HTMLInputElement;
                            if (nameInput.value.trim()) {
                              addCustomItem(field.id, nameInput.value.trim(), descInput.value.trim());
                              nameInput.value = '';
                              descInput.value = '';
                            }
                          }}
                          className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                        >
                          Add
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Add custom perks that are saved only to this package (not to main inventory)
                      </p>
                    </div>
                  </div>

                  {/* Custom Rooms */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Bed className="inline w-4 h-4 mr-1 text-blue-600" />
                      Custom Rooms (Package Exclusive)
                    </label>
                    <div className="space-y-2">
                      {packageState?.customRooms.map((customRoom) => (
                        <div key={customRoom.id} className="flex items-center gap-2 p-2 border rounded bg-blue-50">
                          <span className="flex-1 text-sm">
                            <strong>{customRoom.name}</strong>
                            <span className="text-gray-600"> - {customRoom.type}</span>
                            <span className="text-gray-500 text-xs block">
                              Capacity: {customRoom.capacity} | Available: {customRoom.availability}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomRoom(field.id, customRoom.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomRoomModal(field.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        <Plus className="w-3 h-3" />
                        Add Custom Room
                      </button>
                      <p className="text-xs text-gray-500">
                        Create package-exclusive rooms that won't appear in main inventory
                      </p>
                    </div>
                  </div>

                  {/* Custom Cottages */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Home className="inline w-4 h-4 mr-1 text-green-600" />
                      Custom Cottages (Package Exclusive)
                    </label>
                    <div className="space-y-2">
                      {packageState?.customCottages.map((customCottage) => (
                        <div key={customCottage.id} className="flex items-center gap-2 p-2 border rounded bg-green-50">
                          <span className="flex-1 text-sm">
                            <strong>{customCottage.name}</strong>
                            <span className="text-gray-600"> - {customCottage.type}</span>
                            <span className="text-gray-500 text-xs block">
                              Capacity: {customCottage.capacity} | Available: {customCottage.availability}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomCottage(field.id, customCottage.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomCottageModal(field.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        <Plus className="w-3 h-3" />
                        Add Custom Cottage
                      </button>
                      <p className="text-xs text-gray-500">
                        Create package-exclusive cottages that won't appear in main inventory
                      </p>
                    </div>
                  </div>

                  {/* Custom Amenities */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Sparkles className="inline w-4 h-4 mr-1 text-purple-600" />
                      Custom Amenities (Package Exclusive)
                    </label>
                    <div className="space-y-2">
                      {packageState?.customAmenities.map((customAmenity) => (
                        <div key={customAmenity.id} className="flex items-center gap-2 p-2 border rounded bg-purple-50">
                          <span className="flex-1 text-sm">
                            <strong>{customAmenity.name}</strong>
                            <span className="text-gray-600"> - Qty: {customAmenity.quantity}</span>
                            <span className={`text-xs ml-2 px-2 py-0.5 rounded ${
                              customAmenity.inclusionType === 'included' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {customAmenity.inclusionType === 'included' ? 'Included' : 'Add-on'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeCustomAmenity(field.id, customAmenity.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowCustomAmenityModal(field.id)}
                        className="flex items-center gap-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                      >
                        <Plus className="w-3 h-3" />
                        Add Custom Amenity
                      </button>
                      <p className="text-xs text-gray-500">
                        Create package-exclusive amenities that won't appear in main inventory
                      </p>
                    </div>
                  </div>

                  {/* Entrance Fees */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🎫 Included Entrance Fees
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
                        <input
                          {...control.register(`packages.${index}.includedAdultEntranceFee` as const)}
                          type="checkbox"
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          Adult Entrance Fee (Day: ₱{adultEntranceFee?.dayRate || 0}, Night: ₱{adultEntranceFee?.nightRate || 0})
                        </span>
                      </label>
                      <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
                        <input
                          {...control.register(`packages.${index}.includedChildEntranceFee` as const)}
                          type="checkbox"
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          Child Entrance Fee (Available rates for children)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => confirmPackage(field.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      confirmedPackages.has(field.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {confirmedPackages.has(field.id) ? 'Confirmed' : 'Confirm Package'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Room Modal */}
      {showCustomRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Custom Room</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                <input
                  type="text"
                  id="custom-room-name"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Honeymoon Suite - Package Exclusive"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <input
                  type="text"
                  id="custom-room-type"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Suite, Deluxe, Standard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="custom-room-description"
                  className="w-full border rounded px-3 py-2 h-20 resize-none"
                  placeholder="Describe features and highlights..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Guests)</label>
                <input
                  type="number"
                  id="custom-room-capacity"
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                <textarea
                  id="custom-room-features"
                  className="w-full border rounded px-3 py-2 h-20 resize-none"
                  placeholder="Bed configuration, view type, amenities..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability (Units)</label>
                <input
                  type="number"
                  id="custom-room-availability"
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  placeholder="1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCustomRoomModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = (document.getElementById('custom-room-name') as HTMLInputElement)?.value;
                  const type = (document.getElementById('custom-room-type') as HTMLInputElement)?.value;
                  const description = (document.getElementById('custom-room-description') as HTMLTextAreaElement)?.value;
                  const capacity = parseInt((document.getElementById('custom-room-capacity') as HTMLInputElement)?.value || '0');
                  const features = (document.getElementById('custom-room-features') as HTMLTextAreaElement)?.value;
                  const availability = parseInt((document.getElementById('custom-room-availability') as HTMLInputElement)?.value || '0');

                  if (name && type && capacity > 0 && availability > 0) {
                    addCustomRoom(showCustomRoomModal!, { name, type, description, capacity, features, availability });
                    setShowCustomRoomModal(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cottage Modal */}
      {showCustomCottageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Custom Cottage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cottage Name</label>
                <input
                  type="text"
                  id="custom-cottage-name"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Beachfront Villa - Package Exclusive"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cottage Type</label>
                <input
                  type="text"
                  id="custom-cottage-type"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Villa, Cabana, Bungalow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="custom-cottage-description"
                  className="w-full border rounded px-3 py-2 h-20 resize-none"
                  placeholder="Describe features and highlights..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Guests)</label>
                <input
                  type="number"
                  id="custom-cottage-capacity"
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  placeholder="4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                <textarea
                  id="custom-cottage-features"
                  className="w-full border rounded px-3 py-2 h-20 resize-none"
                  placeholder="Bed configuration, view type, amenities..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability (Units)</label>
                <input
                  type="number"
                  id="custom-cottage-availability"
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  placeholder="1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCustomCottageModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = (document.getElementById('custom-cottage-name') as HTMLInputElement)?.value;
                  const type = (document.getElementById('custom-cottage-type') as HTMLInputElement)?.value;
                  const description = (document.getElementById('custom-cottage-description') as HTMLTextAreaElement)?.value;
                  const capacity = parseInt((document.getElementById('custom-cottage-capacity') as HTMLInputElement)?.value || '0');
                  const features = (document.getElementById('custom-cottage-features') as HTMLTextAreaElement)?.value;
                  const availability = parseInt((document.getElementById('custom-cottage-availability') as HTMLInputElement)?.value || '0');

                  if (name && type && capacity > 0 && availability > 0) {
                    addCustomCottage(showCustomCottageModal!, { name, type, description, capacity, features, availability });
                    setShowCustomCottageModal(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Cottage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Amenity Modal */}
      {showCustomAmenityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add Custom Amenity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amenity Name</label>
                <input
                  type="text"
                  id="custom-amenity-name"
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Private Beach Dinner"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  id="custom-amenity-description"
                  className="w-full border rounded px-3 py-2 h-20 resize-none"
                  placeholder="Details of what's included..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  id="custom-amenity-quantity"
                  className="w-full border rounded px-3 py-2"
                  min="1"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inclusion Type</label>
                <select
                  id="custom-amenity-inclusion"
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="included">Included in Package</option>
                  <option value="addon">Available as Add-on</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCustomAmenityModal(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const name = (document.getElementById('custom-amenity-name') as HTMLInputElement)?.value;
                  const description = (document.getElementById('custom-amenity-description') as HTMLTextAreaElement)?.value;
                  const quantity = parseInt((document.getElementById('custom-amenity-quantity') as HTMLInputElement)?.value || '0');
                  const inclusionType = (document.getElementById('custom-amenity-inclusion') as HTMLSelectElement)?.value as 'included' | 'addon';

                  if (name && quantity > 0) {
                    addCustomAmenity(showCustomAmenityModal!, { 
                      name, 
                      description, 
                      quantity, 
                      inclusionType
                    });
                    setShowCustomAmenityModal(null);
                  }
                }}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Add Amenity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshPackagesSection;

