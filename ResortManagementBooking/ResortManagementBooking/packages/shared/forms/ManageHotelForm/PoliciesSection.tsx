import { useFormContext, useFieldArray, useWatch } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { Plus, X, Check, FileText } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";

const PoliciesSection = () => {
  const { control, register, formState: { errors }, watch } = useFormContext<HotelFormData>();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "policies.resortPolicies",
  });
  const resortPolicies = useWatch({ control, name: "policies.resortPolicies" });
  const [confirmedPolicies, setConfirmedPolicies] = useState<Set<string>>(new Set());
  const isInitializingRef = useRef(false);
  const confirmedPoliciesRef = useRef<Set<string>>(new Set());

  const handleAddPolicy = () => {
    const newPolicyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    append({
      id: newPolicyId,
      title: "",
      description: "",
      isConfirmed: false,
    });
  };

  // Initialize confirmed states only when component mounts or resort policies change significantly
  useEffect(() => {
    if (resortPolicies && !isInitializingRef.current) {
      isInitializingRef.current = true;
      
      // Only initialize if we don't have any confirmed states yet
      if (confirmedPoliciesRef.current.size === 0) {
        const confirmedIds = resortPolicies
          .filter(policy => policy.isConfirmed)
          .map(policy => policy.id)
          .filter(Boolean);
        
        const newConfirmedSet = new Set(confirmedIds);
        setConfirmedPolicies(newConfirmedSet);
        confirmedPoliciesRef.current = newConfirmedSet;
      }
      
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
    }
  }, [resortPolicies?.length]); // Only run when resort policies length changes

  const confirmPolicy = useCallback((policyId: string) => {
    setConfirmedPolicies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(policyId)) {
        newSet.delete(policyId);
      } else {
        newSet.add(policyId);
      }
      confirmedPoliciesRef.current = newSet;
      return newSet;
    });

    // Update the form data with the new confirmation state
    if (resortPolicies) {
      const policyIndex = resortPolicies.findIndex(policy => policy.id === policyId);
      if (policyIndex !== -1) {
        const isCurrentlyConfirmed = confirmedPoliciesRef.current.has(policyId);
        update(policyIndex, {
          ...resortPolicies[policyIndex],
          isConfirmed: !isCurrentlyConfirmed,
        });
      }
    }
  }, [resortPolicies, update]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Resort Policies</h2>
      
      {/* Check-in/Check-out Times */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Check-in & Check-out Times</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day Rate Times */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-blue-700">Day Rate</h4>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-gray-700 text-sm font-bold">
                Day Check-in Time
                <input
                  type="text"
                  placeholder="e.g., 8:00 AM"
                  className="border rounded w-full py-2 px-3 font-normal"
                  {...register("policies.dayCheckInTime")}
                />
              </label>
              <label className="text-gray-700 text-sm font-bold">
                Day Check-out Time
                <input
                  type="text"
                  placeholder="e.g., 5:00 PM"
                  className="border rounded w-full py-2 px-3 font-normal"
                  {...register("policies.dayCheckOutTime")}
                />
              </label>
            </div>
          </div>

          {/* Night Rate Times */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-purple-700">Night Rate</h4>
            {watch("hasNightRateTimeRestrictions") ? (
              <div className="grid grid-cols-1 gap-3">
                <label className="text-gray-700 text-sm font-bold">
                  Night Check-in Time
                  <input
                    type="text"
                    placeholder="e.g., 6:00 PM"
                    className="border rounded w-full py-2 px-3 font-normal"
                    {...register("policies.nightCheckInTime")}
                  />
                </label>
                <label className="text-gray-700 text-sm font-bold">
                  Night Check-out Time
                  <input
                    type="text"
                    placeholder="e.g., 10:00 AM"
                    className="border rounded w-full py-2 px-3 font-normal"
                    {...register("policies.nightCheckOutTime")}
                  />
                </label>
              </div>
            ) : (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <p className="text-purple-800 text-sm font-medium">
                  Night rate is 24 hour overnight stay
                </p>
                <p className="text-purple-600 text-xs mt-1">
                  Flexible check-in and check-out times
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resort Policies */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-600 text-sm">
              Add custom resort policies with titles and descriptions
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddPolicy}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Policy
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Policy {index + 1}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Policy Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Resort Policy Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cancellation Policy, Pet Policy, Beach Rules"
                    className="w-full border rounded px-3 py-2 font-normal"
                    {...register(`policies.resortPolicies.${index}.title`, {
                      required: "Policy title is required",
                    })}
                  />
                  {errors.policies?.resortPolicies?.[index]?.title && (
                    <span className="text-red-500 text-sm">
                      {errors.policies.resortPolicies[index]?.title?.message}
                    </span>
                  )}
                </div>

                {/* Policy Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Resort Policy Description
                  </label>
                  <textarea
                    placeholder="Describe the policy details, rules, and any important information guests should know..."
                    className="w-full border rounded px-3 py-2 font-normal h-24 resize-none"
                    {...register(`policies.resortPolicies.${index}.description`, {
                      required: "Policy description is required",
                    })}
                  />
                  {errors.policies?.resortPolicies?.[index]?.description && (
                    <span className="text-red-500 text-sm">
                      {errors.policies.resortPolicies[index]?.description?.message}
                    </span>
                  )}
                </div>

                {/* Confirm Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => confirmPolicy(field.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      confirmedPolicies.has(field.id)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    {confirmedPolicies.has(field.id) ? 'Confirmed' : 'Confirm Policy'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {fields.length === 0 && (
          <div className="p-8 text-center text-gray-500 border border-gray-200 rounded-lg">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium mb-1">No resort policies added yet</p>
            <p className="text-sm">Click "Add Policy" to create custom resort policies</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoliciesSection;
