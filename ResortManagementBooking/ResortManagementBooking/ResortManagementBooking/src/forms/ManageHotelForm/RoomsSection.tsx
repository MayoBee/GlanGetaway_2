import { useFormContext, useFieldArray } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, X, Bed, Users, DollarSign } from "lucide-react";

const RoomsSection = () => {
  const { control, register, formState: { errors }, watch } = useFormContext<HotelFormData>();
  const roomFields = watch("rooms") || [];
  const { fields, append, remove } = useFieldArray({
    control,
    name: "rooms",
  });

  const handleAddRoom = () => {
    append({
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      type: "Standard",
      pricePerNight: 0,
      minOccupancy: 1,
      maxOccupancy: 2,
      units: 1,
      description: "",
      amenities: [],
    });
  };

  const roomTypes = ["Standard", "Deluxe", "Suite", "Ocean View", "Garden View", "Beach Front"];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold mb-4">Resort Rooms</h2>
        <p className="text-gray-600 text-sm mb-4">
          Add different room types with their respective prices and amenities
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
                <Bed className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Room {index + 1}</h4>
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
              {/* Room Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Paradise Suite, Ocean View Room"
                  className="w-full border rounded px-3 py-2 font-normal"
                  {...register(`rooms.${index}.name`, {
                    required: "Room name is required",
                  })}
                />
                {errors.rooms?.[index]?.name && (
                  <span className="text-red-500 text-sm">
                    {errors.rooms[index]?.name?.message}
                  </span>
                )}
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  className="w-full border rounded px-3 py-2 font-normal"
                  {...register(`rooms.${index}.type`)}
                >
                  {roomTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Per Night */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Price Per Night (₱)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                    {...register(`rooms.${index}.pricePerNight`, {
                      required: "Price is required",
                      min: { value: 0, message: "Price must be positive" },
                    })}
                  />
                </div>
                {errors.rooms?.[index]?.pricePerNight && (
                  <span className="text-red-500 text-sm">
                    {errors.rooms[index]?.pricePerNight?.message}
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
                      {...register(`rooms.${index}.minOccupancy`, {
                        required: "Min occupancy is required",
                        min: { value: 1, message: "Minimum occupancy must be at least 1 person" },
                        max: { value: 100, message: "Maximum occupancy cannot exceed 100 persons" },
                        validate: (value) => {
                          // Get the current max value from the same field array item
                          const currentRoom = roomFields[index];
                          const maxOccupancy = currentRoom?.maxOccupancy;
                          
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
                      placeholder="2"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`rooms.${index}.maxOccupancy`, {
                        required: "Max occupancy is required",
                        min: { value: 1, message: "At least 1 guest required" },
                        max: { value: 100, message: "Maximum occupancy cannot exceed 100 persons" },
                        validate: (value) => {
                          // Get the current min value from the same field array item
                          const currentRoom = roomFields[index];
                          const minOccupancy = currentRoom?.minOccupancy;
                          
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
                {(errors.rooms?.[index]?.minOccupancy || errors.rooms?.[index]?.maxOccupancy) && (
                  <span className="text-red-500 text-sm">
                    {errors.rooms[index]?.minOccupancy?.message || errors.rooms[index]?.maxOccupancy?.message}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Describe the room features, view, and special amenities..."
                  className="w-full border rounded px-3 py-2 font-normal h-20 resize-none"
                  {...register(`rooms.${index}.description`)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddRoom}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold w-fit"
      >
        <Plus className="w-4 h-4" />
        Add Room
      </button>

      {fields.length === 0 && (
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          No rooms added yet. Click "Add Room" to get started!
        </div>
      )}
    </div>
  );
};

export default RoomsSection;

