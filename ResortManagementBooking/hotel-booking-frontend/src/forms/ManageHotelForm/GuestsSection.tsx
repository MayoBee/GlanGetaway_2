import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, Users, Check, X } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const GuestsSection = () => {
  const {
    register,
    formState: { errors },
    control,
    watch,
  } = useFormContext<HotelFormData>();
  
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "childEntranceFee",
  });

  const childEntranceFees = useWatch({ control, name: "childEntranceFee" });
  const [confirmedAgeGroups, setConfirmedAgeGroups] = useState<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const confirmedAgeGroupsRef = useRef<Set<string>>(new Set());

  const adultPricingModel = watch("adultEntranceFee.pricingModel");

  const handleAddChildAgeGroup = () => {
    const newAgeGroupId = `ageGroup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    append({
      id: newAgeGroupId,
      minAge: 1,
      maxAge: 5,
      dayRate: 0,
      nightRate: 0,
      pricingModel: "per_head",
      groupQuantity: 1,
      isConfirmed: false,
    });
  };

  // Initialize confirmed states only when component mounts or child entrance fees change significantly
  useEffect(() => {
    if (childEntranceFees && !isInitializingRef.current) {
      isInitializingRef.current = true;
      
      // Only initialize if we don't have any confirmed states yet
      if (confirmedAgeGroupsRef.current.size === 0) {
        const confirmedIds = childEntranceFees
          .filter(ageGroup => ageGroup.isConfirmed)
          .map(ageGroup => ageGroup.id)
          .filter(Boolean);
        
        const newConfirmedSet = new Set(confirmedIds);
        setConfirmedAgeGroups(newConfirmedSet);
        confirmedAgeGroupsRef.current = newConfirmedSet;
      }
      
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [childEntranceFees?.length]); // Only run when child entrance fees length changes

  const confirmAgeGroup = useCallback((ageGroupId: string) => {
    setConfirmedAgeGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ageGroupId)) {
        newSet.delete(ageGroupId);
      } else {
        newSet.add(ageGroupId);
      }
      confirmedAgeGroupsRef.current = newSet;
      return newSet;
    });

    // Update the form data with the new confirmation state
    if (childEntranceFees) {
      const ageGroupIndex = childEntranceFees.findIndex(ageGroup => ageGroup.id === ageGroupId);
      if (ageGroupIndex !== -1) {
        const isCurrentlyConfirmed = confirmedAgeGroupsRef.current.has(ageGroupId);
        update(ageGroupIndex, {
          ...childEntranceFees[ageGroupIndex],
          isConfirmed: !isCurrentlyConfirmed,
        });
      }
    }
  }, [childEntranceFees, update]);

  return (
    <div className="space-y-6">
      {/* Adult Entrance Fee Section */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Adult Entrance Fee</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Day Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Day Rate (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                {...register("adultEntranceFee.dayRate", {
                  required: "Day rate is required",
                  min: { value: 0, message: "Rate must be positive" },
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.adultEntranceFee?.dayRate && (
              <span className="text-red-500 text-sm">
                {errors.adultEntranceFee.dayRate.message}
              </span>
            )}
          </div>

          {/* Night Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Night Rate (₱)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                {...register("adultEntranceFee.nightRate", {
                  required: "Night rate is required",
                  min: { value: 0, message: "Rate must be positive" },
                  valueAsNumber: true,
                })}
              />
            </div>
            {errors.adultEntranceFee?.nightRate && (
              <span className="text-red-500 text-sm">
                {errors.adultEntranceFee.nightRate.message}
              </span>
            )}
          </div>

          {/* Pricing Model */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Pricing Model
            </label>
            <select
              className="w-full border rounded px-3 py-2 font-normal"
              {...register("adultEntranceFee.pricingModel", {
                required: "Pricing model is required",
              })}
            >
              <option value="per_head">Per Head</option>
              <option value="per_group">Per Group</option>
            </select>
            {errors.adultEntranceFee?.pricingModel && (
              <span className="text-red-500 text-sm">
                {errors.adultEntranceFee.pricingModel.message}
              </span>
            )}
          </div>

          {/* Group Quantity (only shown when per_group is selected) */}
          {adultPricingModel === "per_group" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Group Quantity
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                  {...register("adultEntranceFee.groupQuantity", {
                    required: "Group quantity is required for group pricing",
                    min: { value: 1, message: "Group quantity must be at least 1" },
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.adultEntranceFee?.groupQuantity && (
                <span className="text-red-500 text-sm">
                  {errors.adultEntranceFee.groupQuantity.message}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Child Entrance Fee Section */}
      <div className="bg-gray-100 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Child Entrance Fee (by Age Group)</h3>
          <button
            type="button"
            onClick={handleAddChildAgeGroup}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Age Group
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-300 rounded-lg p-4 bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Age Group {index + 1}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Min Age */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Min Age (years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    placeholder="1"
                    className="w-full border rounded px-3 py-2 font-normal"
                    {...register(`childEntranceFee.${index}.minAge`, {
                      required: "Minimum age is required",
                      min: { value: 0, message: "Age cannot be negative" },
                      max: { value: 18, message: "Age cannot exceed 18" },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.childEntranceFee?.[index]?.minAge && (
                    <span className="text-red-500 text-sm">
                      {errors.childEntranceFee[index]?.minAge?.message}
                    </span>
                  )}
                </div>

                {/* Max Age */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Max Age (years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="18"
                    placeholder="5"
                    className="w-full border rounded px-3 py-2 font-normal"
                    {...register(`childEntranceFee.${index}.maxAge`, {
                      required: "Maximum age is required",
                      min: { value: 0, message: "Age cannot be negative" },
                      max: { value: 18, message: "Age cannot exceed 18" },
                      valueAsNumber: true,
                    })}
                  />
                  {errors.childEntranceFee?.[index]?.maxAge && (
                    <span className="text-red-500 text-sm">
                      {errors.childEntranceFee[index]?.maxAge?.message}
                    </span>
                  )}
                </div>

                {/* Day Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Day Rate (₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`childEntranceFee.${index}.dayRate`, {
                        required: "Day rate is required",
                        min: { value: 0, message: "Rate must be positive" },
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.childEntranceFee?.[index]?.dayRate && (
                    <span className="text-red-500 text-sm">
                      {errors.childEntranceFee[index]?.dayRate?.message}
                    </span>
                  )}
                </div>

                {/* Night Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Night Rate (₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 flex items-center justify-center text-sm font-medium">₱</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`childEntranceFee.${index}.nightRate`, {
                        required: "Night rate is required",
                        min: { value: 0, message: "Rate must be positive" },
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.childEntranceFee?.[index]?.nightRate && (
                    <span className="text-red-500 text-sm">
                      {errors.childEntranceFee[index]?.nightRate?.message}
                    </span>
                  )}
                </div>

                {/* Pricing Model */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Pricing Model
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2 font-normal"
                    {...register(`childEntranceFee.${index}.pricingModel`, {
                      required: "Pricing model is required",
                    })}
                  >
                    <option value="per_head">Per Head</option>
                    <option value="per_group">Per Group</option>
                  </select>
                  {errors.childEntranceFee?.[index]?.pricingModel && (
                    <span className="text-red-500 text-sm">
                      {errors.childEntranceFee?.[index]?.pricingModel?.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Group Quantity (only shown when per_group is selected) */}
              {watch(`childEntranceFee.${index}.pricingModel`) === "per_group" && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Group Quantity
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      className="w-full border rounded pl-10 pr-3 py-2 font-normal"
                      {...register(`childEntranceFee.${index}.groupQuantity`, {
                        required: "Group quantity is required for group pricing",
                        min: { value: 1, message: "Group quantity must be at least 1" },
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  {errors.childEntranceFee?.[index]?.groupQuantity && (
                    <span className="text-red-500 text-sm">
                      {errors.childEntranceFee?.[index]?.groupQuantity?.message}
                    </span>
                  )}
                </div>
              )}

              {/* Confirm Button */}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => confirmAgeGroup(field.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    confirmedAgeGroups.has(field.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  {confirmedAgeGroups.has(field.id) ? 'Confirmed' : 'Confirm Age Group'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
            No age groups added yet. Click "Add Age Group" to set child pricing by age range.
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestsSection;
