import { useFormContext, useFieldArray } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, X, Home, Users, DollarSign } from "lucide-react";

const CottagesSection = () => {
  const { control, register, formState: { errors }, watch } = useFormContext<HotelFormData>();
  const cottageFields = watch("cottages") || [];
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cottages",
  });

  const handleAddCottage = () => {
    append({
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      type: "Beach Cottage",
      pricePerNight: 0,
      dayRate: 0,
      nightRate: 0,
      hasDayRate: false,
      hasNightRate: false,
      minOccupancy: 1,
      maxOccupancy: 4,
      units: 1,
      description: "",
      amenities: [],
    });
  };

  const cottageTypes = ["Beach Cottage", "Garden Cottage", "Luxury Villa", "Family Cottage", "Romantic Cottage", "Tree House"];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold mb-4">Resort Cottages</h2>
        <p className="text-gray-600 text-sm mb-4">
          Add different cottage types with their respective prices and amenities
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Cottage {index + 1}</h4>
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cottage Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Cottage Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Paradise Beach Villa, Garden Hideaway"
                  className="w-full border rounded px-3 py-2 font-normal"
                  {...register(`cottages.${index}.name`, {
                    required: "Cottage name is required",
                  })}
                />
                {errors.cottages?.[index]?.name && (
                  <span className="text-red-500 text-sm">
                    {errors.cottages[index]?.name?.message}
                  </span>
                )}
              </div>

              {/* Cottage Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Cottage Type
                </label>
                <select
                  className="w-full border rounded px-3 py-2 font-normal"
                  {...register(`cottages.${index}.type`)}
                >
                  {cottageTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pricing Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pricing Options
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`dayRate-${index}`}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      {...register(`cottages.${index}.hasDayRate`)}
                    />
                    <label htmlFor={`dayRate-${index}`} className="text-sm font-medium text-gray-700">
                      Day Rate Available
                    </label>
                    {watch(`cottages.${index}.hasDayRate`) && (
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                          {...register(`cottages.${index}.dayRate`, {
                            required: "Day rate is required when day pricing is enabled",
                            min: { value: 0, message: "Rate must be positive" },
                          })}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`nightRate-${index}`}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      {...register(`cottages.${index}.hasNightRate`)}
                    />
                    <label htmlFor={`nightRate-${index}`} className="text-sm font-medium text-gray-700">
                      Night Rate Available
                    </label>
                    {watch(`cottages.${index}.hasNightRate`) && (
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                          {...register(`cottages.${index}.nightRate`, {
                            required: "Night rate is required when night pricing is enabled",
                            min: { value: 0, message: "Rate must be positive" },
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {(!watch(`cottages.${index}.hasDayRate`) && !watch(`cottages.${index}.hasNightRate`)) && (
                  <span className="text-red-500 text-sm">
                    At least one pricing option must be selected
                  </span>
                )}
                
                {(errors.cottages?.[index]?.dayRate || errors.cottages?.[index]?.nightRate) && (
                  <span className="text-red-500 text-sm">
                    {errors.cottages[index]?.dayRate?.message || errors.cottages[index]?.nightRate?.message}
                  </span>
                )}
              </div>

              {/* Occupancy Range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Occupancy Range (Min-Max)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="1"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`cottages.${index}.minOccupancy`, {
                        required: "Min occupancy is required",
                        min: { value: 1, message: "Minimum occupancy must be at least 1 person" },
                        max: { value: 100, message: "Maximum occupancy cannot exceed 100 persons" },
                        validate: (value) => {
                          // Get current max value from the same field array item
                          const currentCottage = cottageFields[index];
                          const maxOccupancy = currentCottage?.maxOccupancy;
                          
                          // No validation if max is not set or is 0
                          if (!maxOccupancy || maxOccupancy === 0) {
                            return true;
                          }
                          
                          // Ensure value is a number and not negative
                          const numValue = Number(value);
                          if (isNaN(numValue) || numValue < 0) {
                            return "Minimum occupancy cannot be negative";
                          }
                          
                          // Check if min exceeds max
                          if (numValue > maxOccupancy) {
                            return "Minimum occupancy cannot exceed maximum occupancy";
                          }
                          
                          return true;
                        },
                      })}
                    />
                  </div>
                  <span className="text-gray-500 font-semibold">-</span>
                  <div className="relative flex-1">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="4"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`cottages.${index}.maxOccupancy`, {
                        required: "Max occupancy is required",
                        min: { value: 1, message: "At least 1 guest required" },
                        max: { value: 100, message: "Maximum occupancy cannot exceed 100 persons" },
                        validate: (value) => {
                          // Get the current min value from the same field array item
                          const currentCottage = cottageFields[index];
                          const minOccupancy = currentCottage?.minOccupancy;
                          
                          // No validation if min is not set or is 0
                          if (!minOccupancy || minOccupancy === 0) {
                            return true;
                          }
                          
                          // Ensure value is a number and not negative
                          const numValue = Number(value);
                          if (isNaN(numValue) || numValue < 0) {
                            return "Maximum occupancy cannot be negative";
                          }
                          
                          // Check if max is less than min
                          if (numValue < minOccupancy) {
                            return "Maximum occupancy cannot be less than minimum occupancy";
                          }
                          
                          return true;
                        },
                      })}
                    />
                  </div>
                </div>
                {(errors.cottages?.[index]?.minOccupancy || errors.cottages?.[index]?.maxOccupancy) && (
                  <span className="text-red-500 text-sm">
                    {errors.cottages[index]?.minOccupancy?.message || errors.cottages[index]?.maxOccupancy?.message}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Describe the cottage features, privacy, special amenities, and surroundings..."
                  className="w-full border rounded px-3 py-2 font-normal h-20 resize-none"
                  {...register(`cottages.${index}.description`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddCottage}
        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold w-fit"
      >
        <Plus className="w-4 h-4" />
        Add Cottage
      </button>

      {fields.length === 0 && (
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          No cottages added yet. Click "Add Cottage" to get started!
        </div>
      )}
    </div>
  );
};

export default CottagesSection;
