import { useBookingSelection } from "../contexts/BookingSelectionContext";
import { Users, Check, X } from "lucide-react";

const IncludedEntranceFeeSummary = () => {
  const { includedEntranceFees } = useBookingSelection();

  const { totalFreeAdults, totalFreeChildren } = includedEntranceFees;

  if (totalFreeAdults === 0 && totalFreeChildren === 0) {
    return null; // Don't show if no free entrance fees
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-green-800">Included Entrance Fees</h4>
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
          FREE
        </span>
      </div>
      
      <div className="space-y-2">
        {totalFreeAdults > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                {totalFreeAdults} Adult{totalFreeAdults > 1 ? 's' : ''} Free Entrance
              </span>
            </div>
            <span className="text-sm font-medium text-green-600">Included</span>
          </div>
        )}
        
        {totalFreeChildren > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                {totalFreeChildren} Child{totalFreeChildren > 1 ? 'ren' : ''} Free Entrance
              </span>
            </div>
            <span className="text-sm font-medium text-green-600">Included</span>
          </div>
        )}
        
        <div className="text-xs text-green-600 bg-green-100 p-2 rounded mt-2">
          <p className="font-medium">💡 How this works:</p>
          <ul className="space-y-1 mt-1">
            <li>• These entrance fees are automatically included with your booking</li>
            <li>• Additional guests beyond these limits will pay regular entrance fees</li>
            <li>• No need to pay separately - it's already included in your total</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default IncludedEntranceFeeSummary;
