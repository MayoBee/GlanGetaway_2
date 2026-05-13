import { useFormContext } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { CreditCard, Percent, Info, Smartphone } from "lucide-react";

const PaymentModuleSection = () => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<HotelFormData>();

  const downPaymentPercentage = watch("downPaymentPercentage");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-7 h-7 text-blue-600" />
          Payment Module Requirements
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure the down payment percentage required for bookings at your resort.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">
              Down Payment Information
            </h4>
            <p className="text-sm text-blue-700 mb-2">
              The down payment secures the reservation. Guests will pay this amount 
              online during booking, and the remaining balance will be paid at the resort.
            </p>
            <div className="bg-white border border-blue-300 rounded-md p-3">
              <div className="text-sm font-medium text-blue-800">
                Example Calculation:
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Total Booking: ₱10,000<br />
                Down Payment ({downPaymentPercentage || 50}%): ₱{(10000 * ((downPaymentPercentage || 50) / 100)).toLocaleString()}<br />
                Remaining Balance: ₱{(10000 - (10000 * ((downPaymentPercentage || 50) / 100))).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Down Payment Percentage
        </label>
        <div className="relative">
          <input
            type="number"
            min="10"
            max="100"
            step="5"
            placeholder="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
            {...register("downPaymentPercentage", {
              required: "Down payment percentage is required",
              min: {
                value: 10,
                message: "Minimum down payment is 10%",
              },
              max: {
                value: 100,
                message: "Maximum down payment is 100%",
              },
              valueAsNumber: true,
            })}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 text-sm font-medium">%</span>
          </div>
        </div>
        {errors.downPaymentPercentage && (
          <p className="text-red-500 text-sm">
            {errors.downPaymentPercentage.message as string}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Set the percentage of the total booking cost required as down payment. 
          Minimum 10%, maximum 100%. Recommended range: 30-70%.
        </p>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          GCash Number
        </label>
        <input
          type="text"
          placeholder="09XXXXXXXXX"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          {...register("gcashNumber", {
            pattern: {
              value: /^09\d{9}$/,
              message: "GCash number must start with 09 and be 11 digits long (e.g., 09XXXXXXXXX)",
            },
          })}
        />
        {errors.gcashNumber && (
          <p className="text-red-500 text-sm">
            {errors.gcashNumber.message as string}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Enter your GCash number for guests to send payments to. 
          Format: 09XXXXXXXXX (11 digits starting with 09).
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-800 mb-1">
              Business Guidelines
            </h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Higher percentages (50-70%) provide better booking security</li>
              <li>• Lower percentages (20-40%) may increase booking conversion</li>
              <li>• Consider your target market and competition</li>
              <li>• This setting applies to all bookings at your resort</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModuleSection;
