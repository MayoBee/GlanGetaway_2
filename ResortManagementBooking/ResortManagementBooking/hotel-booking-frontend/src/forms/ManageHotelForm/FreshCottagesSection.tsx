import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, Users, Home, Check, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import ImageUpload from "../../components/ImageUpload";

const FreshCottagesSection = () => {
  const { control } = useFormContext<HotelFormData>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "cottages",
  });
  const cottages = useWatch({ control, name: "cottages" });
  const [confirmedCottages, setConfirmedCottages] = useState<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const confirmedCottagesRef = useRef<Set<string>>(new Set());

  const addCottage = () => {
    const newCottageId = `cottage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    append({
      id: newCottageId,
      name: "",
      type: "",
      pricePerNight: 0,
      dayRate: 0,
      nightRate: 0,
      hasDayRate: false,
      hasNightRate: false,
      minOccupancy: 1,
      maxOccupancy: 1,
      units: 1,
      description: "",
      amenities: [],
      imageUrl: "",
      isConfirmed: false,
    });
  };

  // Initialize confirmed states only when component mounts or cottages change significantly
  useEffect(() => {
    if (cottages && !isInitializingRef.current) {
      isInitializingRef.current = true;
      
      // Only initialize if we don't have any confirmed states yet
      if (confirmedCottagesRef.current.size === 0) {
        const confirmedIds = cottages
          .filter(cottage => cottage.isConfirmed)
          .map(cottage => cottage.id)
          .filter(Boolean);
        
        const newConfirmedSet = new Set(confirmedIds);
        setConfirmedCottages(newConfirmedSet);
        confirmedCottagesRef.current = newConfirmedSet;
      }
      
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [cottages?.length]); // Only run when cottages length changes

  const confirmCottage = useCallback((cottageId: string) => {
    setConfirmedCottages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cottageId)) {
        newSet.delete(cottageId);
      } else {
        newSet.add(cottageId);
      }
      confirmedCottagesRef.current = newSet;
      return newSet;
    });

    // Update the form data with the new confirmation state
    if (cottages) {
      const cottageIndex = cottages.findIndex(cottage => cottage.id === cottageId);
      if (cottageIndex !== -1) {
        const isCurrentlyConfirmed = confirmedCottagesRef.current.has(cottageId);
        update(cottageIndex, {
          ...cottages[cottageIndex],
          isConfirmed: !isCurrentlyConfirmed,
        });
      }
    }
  }, [cottages, update]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Cottages</h3>
        <button
          type="button"
          onClick={addCottage}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Cottage
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No cottages added yet</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-800">Cottage {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cottage Image */}
                <div className="md:col-span-2">
                  <ImageUpload
                    value={cottages?.[index]?.imageUrl || ""}
                    onChange={(url: string) => {
                      if (cottages) {
                        const updatedCottages = [...cottages];
                        updatedCottages[index] = { ...updatedCottages[index], imageUrl: url };
                        // Update using the update method from useFieldArray
                        update(index, updatedCottages[index]);
                      }
                    }}
                    label="Cottage Image"
                  />
                </div>

                {/* Cottage Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cottage Name
                  </label>
                  <input
                    {...control.register(`cottages.${index}.name` as const)}
                    type="text"
                    placeholder="e.g., Beach Villa, Garden Cottage"
                    className="w-full border rounded px-3 py-2 font-normal"
                  />
                </div>

                {/* Cottage Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cottage Type
                  </label>
                  <select
                    {...control.register(`cottages.${index}.type` as const)}
                    className="w-full border rounded px-3 py-2 font-normal"
                  >
                    <option value="">Select cottage type</option>
                    <option value="Beach Villa">Beach Villa</option>
                    <option value="Garden Cottage">Garden Cottage</option>
                    <option value="Pool Villa">Pool Villa</option>
                    <option value="Family Cottage">Family Cottage</option>
                    <option value="Romantic Cottage">Romantic Cottage</option>
                    <option value="Luxury Villa">Luxury Villa</option>
                  </select>
                </div>

                {/* Day Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Day Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      {...control.register(`cottages.${index}.hasDayRate` as const)}
                      type="checkbox"
                      className="w-4 h-4 text-green-600 border-green-300 rounded"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
                      <input
                        {...control.register(`cottages.${index}.dayRate` as const)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Check to enable day rate pricing</p>
                </div>

                {/* Night Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Night Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      {...control.register(`cottages.${index}.hasNightRate` as const)}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-blue-300 rounded"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
                      <input
                        {...control.register(`cottages.${index}.nightRate` as const)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Check to enable night rate pricing</p>
                </div>

                {/* Units */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Available Units
                  </label>
                  <input
                    {...control.register(`cottages.${index}.units` as const, {
                      onChange: (e) => {
                        console.log(`=== COTTAGE UNITS INPUT CHANGE ===`);
                        console.log(`Cottage index: ${index}`);
                        console.log(`New value:`, e.target.value);
                        console.log(`Current cottage data:`, cottages?.[index]);
                        console.log(`Parsed value:`, parseInt(e.target.value) || 1);
                        
                        // Update the form value to ensure it's stored as a number
                        const numericValue = parseInt(e.target.value) || 1;
                        const currentCottage = cottages?.[index];
                        if (currentCottage) {
                          update(index, {
                            ...currentCottage,
                            units: numericValue
                          });
                        }
                      }
                    })}
                    type="number"
                    min="1"
                    max="100"
                    placeholder="1"
                    className="w-full border rounded px-3 py-2 font-normal"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of available units</p>
                </div>

                {/* Occupancy Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Occupancy Range
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        {...control.register(`cottages.${index}.minOccupancy` as const)}
                        type="number"
                        min="1"
                        max="100"
                        placeholder="1"
                        className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      />
                    </div>
                    <span className="text-gray-500 font-semibold">-</span>
                    <div className="relative flex-1">
                      <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        {...control.register(`cottages.${index}.maxOccupancy` as const)}
                        type="number"
                        min="1"
                        max="100"
                        placeholder="1"
                        className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum people - Maximum people</p>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  {...control.register(`cottages.${index}.description` as const)}
                  rows={3}
                  placeholder="Describe the cottage features, view, amenities..."
                  className="w-full border rounded px-3 py-2 font-normal resize-none"
                />
              </div>

              {/* Confirm Button */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => confirmCottage(field.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    confirmedCottages.has(field.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {confirmedCottages.has(field.id) ? 'Confirmed' : 'Confirm Cottage'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreshCottagesSection;

