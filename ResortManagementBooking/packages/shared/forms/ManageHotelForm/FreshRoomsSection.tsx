import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, Users, Bed, Check, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import ImageUpload from "../../components/ImageUpload";

const FreshRoomsSection = () => {
  const { control } = useFormContext<HotelFormData>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "rooms",
  });
  const rooms = useWatch({ control, name: "rooms" });
  const [confirmedRooms, setConfirmedRooms] = useState<Set<string>>(new Set());
  const [roomFiles, setRoomFiles] = useState<Map<string, File>>(new Map());
  const isInitializingRef = useRef(false);
  const confirmedRoomsRef = useRef<Set<string>>(new Set());

  const addRoom = () => {
    const newRoomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    append({
      id: newRoomId,
      name: "",
      type: "",
      pricePerNight: 0,
      minOccupancy: 1,
      maxOccupancy: 1,
      units: 1,
      description: "",
      amenities: [],
      imageUrl: "",
      isConfirmed: false,
    });
  };

  // Initialize confirmed states only when component mounts or rooms change significantly
  useEffect(() => {
    if (rooms && !isInitializingRef.current) {
      isInitializingRef.current = true;
      
      // Only initialize if we don't have any confirmed states yet
      if (confirmedRoomsRef.current.size === 0) {
        const confirmedIds = rooms
          .filter(room => room.isConfirmed)
          .map(room => room.id)
          .filter(Boolean);
        
        const newConfirmedSet = new Set(confirmedIds);
        setConfirmedRooms(newConfirmedSet);
        confirmedRoomsRef.current = newConfirmedSet;
      }
      
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [rooms?.length]); // Only run when rooms length changes

  const confirmRoom = useCallback((roomId: string) => {
    setConfirmedRooms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(roomId)) {
        newSet.delete(roomId);
      } else {
        newSet.add(roomId);
      }
      confirmedRoomsRef.current = newSet;
      return newSet;
    });

    // Update the form data with the new confirmation state
    if (rooms) {
      const roomIndex = rooms.findIndex(room => room.id === roomId);
      if (roomIndex !== -1) {
        const isCurrentlyConfirmed = confirmedRoomsRef.current.has(roomId);
        update(roomIndex, {
          ...rooms[roomIndex],
          isConfirmed: !isCurrentlyConfirmed,
        });
      }
    }
  }, [rooms, update]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Rooms</h3>
        <button
          type="button"
          onClick={addRoom}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Bed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No rooms added yet</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium text-gray-800">Room {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Room Image */}
                <div className="md:col-span-2">
                  <ImageUpload
                    value={rooms?.[index]?.imageUrl || ""}
                    onChange={(url: string) => {
                      console.log(`=== ROOM IMAGE CHANGE DEBUG ===`);
                      console.log(`Room ${index} image URL changed to:`, url.substring(0, 50) + "...");
                      if (rooms) {
                        const updatedRooms = [...rooms];
                        updatedRooms[index] = { ...updatedRooms[index], imageUrl: url };
                        // Update using the update method from useFieldArray
                        update(index, updatedRooms[index]);
                        console.log(`Room ${index} updated in form`);
                      }
                    }}
                    onFileChange={(file: File) => {
                      console.log(`=== ROOM FILE CHANGE DEBUG ===`);
                      console.log(`Room ${index} file received:`, file.name, file.size);
                      // Store the file for upload
                      const newRoomFiles = new Map(roomFiles);
                      newRoomFiles.set(`room_${index}`, file);
                      setRoomFiles(newRoomFiles);
                      console.log(`Room ${index} file stored in roomFiles map`);
                      
                      // Also update the imageUrl with a temporary preview
                      if (rooms) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const dataUrl = e.target?.result as string;
                          const updatedRooms = [...rooms];
                          updatedRooms[index] = { ...updatedRooms[index], imageUrl: dataUrl };
                          update(index, updatedRooms[index]);
                          console.log(`Room ${index} data URL set in form`);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    label="Room Image"
                  />
                </div>

                {/* Room Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Room Name
                  </label>
                  <input
                    {...control.register(`rooms.${index}.name` as const)}
                    type="text"
                    placeholder="e.g., Paradise Suite, Ocean View Room"
                    className="w-full border rounded px-3 py-2 font-normal"
                  />
                </div>

                {/* Room Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Room Type
                  </label>
                  <select
                    {...control.register(`rooms.${index}.type` as const)}
                    className="w-full border rounded px-3 py-2 font-normal"
                  >
                    <option value="">Select room type</option>
                    <option value="Standard">Standard Room</option>
                    <option value="Deluxe">Deluxe Room</option>
                    <option value="Suite">Suite</option>
                    <option value="Family">Family Room</option>
                    <option value="Ocean View">Ocean View</option>
                    <option value="Garden View">Garden View</option>
                  </select>
                </div>

                {/* Price Per Night */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Price Per Night
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
                    <input
                      {...control.register(`rooms.${index}.pricePerNight` as const)}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                    />
                  </div>
                </div>

                {/* Units */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Available Units
                  </label>
                  <input
                    {...control.register(`rooms.${index}.units` as const, {
                      onChange: (e) => {
                        console.log(`=== ROOM UNITS INPUT CHANGE ===`);
                        console.log(`Room index: ${index}`);
                        console.log(`New value:`, e.target.value);
                        console.log(`Current room data:`, rooms?.[index]);
                        console.log(`Parsed value:`, parseInt(e.target.value) || 1);
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
                        {...control.register(`rooms.${index}.minOccupancy` as const)}
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
                        {...control.register(`rooms.${index}.maxOccupancy` as const)}
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
                  {...control.register(`rooms.${index}.description` as const)}
                  rows={3}
                  placeholder="Describe the room features, view, amenities..."
                  className="w-full border rounded px-3 py-2 font-normal resize-none"
                />
              </div>

              {/* Confirm Button */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => confirmRoom(field.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    confirmedRooms.has(field.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {confirmedRooms.has(field.id) ? 'Confirmed' : 'Confirm Room'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FreshRoomsSection;
