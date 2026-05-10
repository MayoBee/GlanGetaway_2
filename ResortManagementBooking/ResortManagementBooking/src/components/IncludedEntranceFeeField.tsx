import { useFormContext, Controller } from "react-hook-form";
import { Users, Ticket } from "lucide-react";

interface IncludedEntranceFeeFieldProps {
  accommodationType: 'room' | 'cottage';
  index: number;
  fieldName: string;
}

const IncludedEntranceFeeField = ({ 
  accommodationType, 
  index, 
  fieldName 
}: IncludedEntranceFeeFieldProps) => {
  const { control } = useFormContext();

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="w-4 h-4 text-blue-600" />
        <h4 className="font-semibold text-gray-800">Included Entrance Fees</h4>
        <span className="text-xs text-gray-500">(Free entrance with booking)</span>
      </div>

      <div className="space-y-3">
        {/* Enable/Disable Included Entrance Fees */}
        <Controller
          name={`${fieldName}.${index}.includedEntranceFee.enabled`}
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`${fieldName}-${index}-included-entrance-enabled`}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={field.value || false}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              <label 
                htmlFor={`${fieldName}-${index}-included-entrance-enabled`}
                className="text-sm font-medium text-gray-700"
              >
                Enable free entrance fees for this {accommodationType}
              </label>
            </div>
          )}
        />

        {/* Adult Count */}
        <Controller
          name={`${fieldName}.${index}.includedEntranceFee.adultCount`}
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-3 h-3 inline mr-1" />
                  Free Adults
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 6"
                  value={field.value || 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </div>

              {/* Child Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Users className="w-3 h-3 inline mr-1" />
                  Free Children
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 0"
                  value={field.value || 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        />

        {/* Help Text */}
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
          <p className="font-medium mb-1">💡 How this works:</p>
          <ul className="space-y-1">
            <li>• When guests book this {accommodationType}, entrance fees are automatically included</li>
            <li>• Specify how many adults and children get free entrance</li>
            <li>• Additional guests beyond these limits will pay regular entrance fees</li>
            <li>• Example: "6 adults free" means first 6 adults pay no entrance fee</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IncludedEntranceFeeField;
