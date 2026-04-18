import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, X, Package, DollarSign, Home, Bed } from "lucide-react";

const PackagesSection = () => {
  const { control, register, formState: { errors } } = useFormContext<HotelFormData>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "packages",
  });

  // Watch the cottages, rooms, and amenities to use in package selection
  const cottages = useWatch({ control, name: "cottages" });
  const rooms = useWatch({ control, name: "rooms" });
  const amenities = useWatch({ control, name: "amenities" });

  const handleAddPackage = () => {
    append({
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      description: "",
      price: 0,
      includedCottages: [],
      includedRooms: [],
      includedAmenities: [],
      includedAdultEntranceFee: false,
      includedChildEntranceFee: false,
      customItems: [],
    });
  };

  const handleCottageToggle = (packageIndex: number, cottageId: string) => {
    const currentPackages = control._formValues.packages;
    const packageToUpdate = currentPackages[packageIndex];
    const isIncluded = packageToUpdate.includedCottages.includes(cottageId);
    
    if (isIncluded) {
      packageToUpdate.includedCottages = packageToUpdate.includedCottages.filter((id: string) => id !== cottageId);
    } else {
      packageToUpdate.includedCottages.push(cottageId);
    }
    
    // Force re-render by updating the field array
    control._formValues.packages = [...currentPackages];
  };

  const handleRoomToggle = (packageIndex: number, roomId: string) => {
    const currentPackages = control._formValues.packages;
    const packageToUpdate = currentPackages[packageIndex];
    const isIncluded = packageToUpdate.includedRooms.includes(roomId);
    
    if (isIncluded) {
      packageToUpdate.includedRooms = packageToUpdate.includedRooms.filter((id: string) => id !== roomId);
    } else {
      packageToUpdate.includedRooms.push(roomId);
    }
    
    // Force re-render by updating the field array
    control._formValues.packages = [...currentPackages];
  };

  const handleAmenityToggle = (packageIndex: number, amenityId: string) => {
    const currentPackages = control._formValues.packages;
    const packageToUpdate = currentPackages[packageIndex];
    const isIncluded = packageToUpdate.includedAmenities.includes(amenityId);
    
    if (isIncluded) {
      packageToUpdate.includedAmenities = packageToUpdate.includedAmenities.filter((id: string) => id !== amenityId);
    } else {
      packageToUpdate.includedAmenities.push(amenityId);
    }
    
    // Force re-render by updating the field array
    control._formValues.packages = [...currentPackages];
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold mb-4">Package Offers</h2>
        <p className="text-gray-600 text-sm mb-4">
          Create special packages by combining cottages, rooms, and amenities at a discounted price
        </p>
        <p className="text-gray-500 text-xs mb-4">
          Note: You must add cottages, rooms, and amenities first before creating packages
        </p>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {fields.map((field, index) => {
          const currentPackage = control._formValues.packages?.[index] || {};
          
          return (
            <div
              key={field.id}
              className="border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Package {index + 1}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Package Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Package Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Romantic Getaway, Family Fun Package"
                    className="w-full border rounded px-3 py-2 font-normal"
                    {...register(`packages.${index}.name`, {
                      required: "Package name is required",
                    })}
                  />
                  {errors.packages?.[index]?.name && (
                    <span className="text-red-500 text-sm">
                      {errors.packages[index]?.name?.message}
                    </span>
                  )}
                </div>

                {/* Package Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Package Price (₱)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`packages.${index}.price`, {
                        required: "Package price is required",
                        min: { value: 0, message: "Price must be positive" },
                      })}
                    />
                  </div>
                  {errors.packages?.[index]?.price && (
                    <span className="text-red-500 text-sm">
                      {errors.packages[index]?.price?.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Package Description */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Package Description
                </label>
                <textarea
                  placeholder="Describe what's included in this package and any special features..."
                  className="w-full border rounded px-3 py-2 font-normal h-20 resize-none"
                  {...register(`packages.${index}.description`, {
                    required: "Package description is required",
                  })}
                />
                {errors.packages?.[index]?.description && (
                  <span className="text-red-500 text-sm">
                    {errors.packages[index]?.description?.message}
                  </span>
                )}
              </div>

              {/* Included Items */}
              <div className="space-y-4">
                {/* Cottages Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Home className="inline w-4 h-4 mr-1" />
                    Included Cottages
                  </label>
                  {cottages && cottages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {cottages.map((cottage) => (
                        <label
                          key={cottage.id}
                          className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={currentPackage.includedCottages?.includes(cottage.id) || false}
                            onChange={() => handleCottageToggle(index, cottage.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {cottage.name} - ₱{cottage.pricePerNight}/night
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No cottages available. Add cottages first.</p>
                  )}
                </div>

                {/* Rooms Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Bed className="inline w-4 h-4 mr-1" />
                    Included Rooms
                  </label>
                  {rooms && rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rooms.map((room) => (
                        <label
                          key={room.id}
                          className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={currentPackage.includedRooms?.includes(room.id) || false}
                            onChange={() => handleRoomToggle(index, room.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {room.name} - ₱{room.pricePerNight}/night
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No rooms available. Add rooms first.</p>
                  )}
                </div>

                {/* Amenities Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Included Amenities
                  </label>
                  {amenities && amenities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {amenities.map((amenity) => (
                        <label
                          key={amenity.id}
                          className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={currentPackage.includedAmenities?.includes(amenity.id) || false}
                            onChange={() => handleAmenityToggle(index, amenity.id)}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {amenity.name} - ₱{amenity.price}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No amenities available. Add amenities first.</p>
                  )}
                </div>

                {/* Entrance Fees Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🎫 Included Entrance Fees
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={currentPackage.includedAdultEntranceFee || false}
                        onChange={(e) => {
                          const currentPackages = control._formValues.packages;
                          currentPackages[index].includedAdultEntranceFee = e.target.checked;
                          control._formValues.packages = [...currentPackages];
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        Adult Entrance Fee (Day Rate: ₱{control._formValues.adultEntranceFee?.dayRate || 0}, Night Rate: ₱{control._formValues.adultEntranceFee?.nightRate || 0})
                      </span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-100">
                      <input
                        type="checkbox"
                        checked={currentPackage.includedChildEntranceFee || false}
                        onChange={(e) => {
                          const currentPackages = control._formValues.packages;
                          currentPackages[index].includedChildEntranceFee = e.target.checked;
                          control._formValues.packages = [...currentPackages];
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        Child Entrance Fee (Available rates for children)
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 When included in a package, entrance fees become free for the user since they're already paid for in the package price.
                  </p>
                </div>
              </div>

              {/* Hidden inputs are removed - arrays are handled manually in ManageHotelForm.tsx */}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleAddPackage}
        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-semibold w-fit"
      >
        <Plus className="w-4 h-4" />
        Add Package
      </button>

      {fields.length === 0 && (
        <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
          No packages added yet. Click "Add Package" to get started!
        </div>
      )}
    </div>
  );
};

export default PackagesSection;
