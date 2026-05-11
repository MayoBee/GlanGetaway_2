import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, X, Check } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import ImageUpload from "../../components/ImageUpload";

const AmenitiesSection = () => {
  const { control, register, formState: { errors } } = useFormContext<HotelFormData>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "amenities",
  });
  const amenities = useWatch({ control, name: "amenities" });
  const [confirmedAmenities, setConfirmedAmenities] = useState<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const confirmedAmenitiesRef = useRef<Set<string>>(new Set());

  const handleAddAmenity = () => {
    const newAmenityId = Math.random().toString(36).substr(2, 9);
    append({
      id: newAmenityId,
      name: "",
      price: 0,
      units: 1,
      description: "",
      imageUrl: "",
      isConfirmed: false,
    });
  };

  // Initialize confirmed states only when component mounts or amenities change significantly
  useEffect(() => {
    if (amenities && !isInitializingRef.current) {
      isInitializingRef.current = true;
      
      // Only initialize if we don't have any confirmed states yet
      if (confirmedAmenitiesRef.current.size === 0) {
        const confirmedIds = amenities
          .filter(amenity => amenity.isConfirmed)
          .map(amenity => amenity.id)
          .filter(Boolean);
        
        const newConfirmedSet = new Set(confirmedIds);
        setConfirmedAmenities(newConfirmedSet);
        confirmedAmenitiesRef.current = newConfirmedSet;
      }
      
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [amenities?.length]); // Only run when amenities length changes

  const confirmAmenity = useCallback((amenityId: string) => {
    setConfirmedAmenities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(amenityId)) {
        newSet.delete(amenityId);
      } else {
        newSet.add(amenityId);
      }
      confirmedAmenitiesRef.current = newSet;
      return newSet;
    });

    // Update the form data with the new confirmation state
    if (amenities) {
      const amenityIndex = amenities.findIndex(amenity => amenity.id === amenityId);
      if (amenityIndex !== -1) {
        const isCurrentlyConfirmed = confirmedAmenitiesRef.current.has(amenityId);
        update(amenityIndex, {
          ...amenities[amenityIndex],
          isConfirmed: !isCurrentlyConfirmed,
        });
      }
    }
  }, [amenities, update]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Beach Resort Amenities & Activities</h2>
        <button
          type="button"
          onClick={handleAddAmenity}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Amenity
        </button>
      </div>
      <p className="text-gray-600 text-sm">
        Add water sports, activities, and other amenities with their prices (e.g., Kayaks, Banana Boat, Karaoke)
      </p>

      <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-300 rounded-lg bg-gray-50 p-4 space-y-4"
          >
            {/* Amenity Image */}
            <div>
              <ImageUpload
                value={amenities?.[index]?.imageUrl || ""}
                onChange={(url: string) => {
                  if (amenities) {
                    const updatedAmenities = [...amenities];
                    updatedAmenities[index] = { ...updatedAmenities[index], imageUrl: url };
                    // Update using the update method from useFieldArray
                    update(index, updatedAmenities[index]);
                  }
                }}
                label="Amenity Image"
              />
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Amenity Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Kayaks, Banana Boat, Karaoke"
                  className="w-full border rounded px-3 py-2 font-normal"
                  {...register(`amenities.${index}.name`, {
                    required: "Amenity name is required",
                  })}
                />
                {errors.amenities?.[index]?.name && (
                  <span className="text-red-500 text-sm">
                    {errors.amenities[index]?.name?.message}
                  </span>
                )}
              </div>

            <div className="w-24">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Units
              </label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="1"
                className="w-full border rounded px-3 py-2 font-normal"
                {...register(`amenities.${index}.units`, {
                  required: "Units is required",
                  min: { value: 1, message: "Units must be at least 1" },
                  onChange: (e) => {
                    console.log(`=== AMENITY UNITS INPUT CHANGE ===`);
                    console.log(`Amenity index: ${index}`);
                    console.log(`New value:`, e.target.value);
                    console.log(`Current amenity data:`, amenities?.[index]);
                    console.log(`Parsed value:`, parseInt(e.target.value) || 1);
                    
                    // Update the form value to ensure it's stored as a number
                    const numericValue = parseInt(e.target.value) || 1;
                    const currentAmenity = amenities?.[index];
                    if (currentAmenity) {
                      update(index, {
                        ...currentAmenity,
                        units: numericValue
                      });
                    }
                  }
                })}
              />
              {errors.amenities?.[index]?.units && (
                <span className="text-red-500 text-sm">
                  {errors.amenities[index]?.units?.message}
                </span>
              )}
            </div>

            <div className="w-32">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Price (₱)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border rounded px-3 py-2 font-normal"
                {...register(`amenities.${index}.price`, {
                  required: "Price is required",
                  min: { value: 0, message: "Price must be positive" },
                })}
              />
              {errors.amenities?.[index]?.price && (
                <span className="text-red-500 text-sm">
                  {errors.amenities[index]?.price?.message}
                </span>
              )}
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., 30-minute tour"
                className="w-full border rounded px-3 py-2 font-normal"
                {...register(`amenities.${index}.description`)}
              />
            </div>
            </div>

            <div className="flex gap-2">
            <button
              type="button"
              onClick={() => confirmAmenity(field.id)}
              className={`p-2 rounded transition flex items-center gap-1 ${
                confirmedAmenities.has(field.id)
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title={confirmedAmenities.has(field.id) ? 'Confirmed' : 'Confirm Amenity'}
            >
              <Check className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
            </div>
          </div>
        ))}
      </div>


      {fields.length === 0 && (
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          No amenities added yet. Click "Add Amenity" to get started!
        </div>
      )}
    </div>
  );
};

export default AmenitiesSection;

