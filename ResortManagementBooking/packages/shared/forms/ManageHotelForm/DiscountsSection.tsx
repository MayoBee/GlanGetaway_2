import { useFormContext } from "react-hook-form";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "../../components/ui/card";
import { 
  Percent,
  AlertCircle
} from "lucide-react";

export type DiscountsFormData = {
  seniorCitizenEnabled: boolean;
  seniorCitizenPercentage: number;
  pwdEnabled: boolean;
  pwdPercentage: number;
};

const DiscountsSection = () => {
  const { register, watch } = useFormContext<{
    discounts: DiscountsFormData;
  }>();
  
  // Watch standard discounts
  const seniorCitizenEnabled = watch("discounts.seniorCitizenEnabled");
  const pwdEnabled = watch("discounts.pwdEnabled");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Discount Settings</h2>
        <p className="text-gray-600">
          Configure discounts for your beach resort. These discounts will be available to guests during booking.
        </p>
      </div>

      {/* Standard Discounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Percent className="w-5 h-5 mr-2" />
            Standard Discounts
          </CardTitle>
          <CardDescription>
            Enable discounts for Senior Citizens and Persons with Disabilities (PWD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Senior Citizen Discount */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="seniorCitizenEnabled"
              {...register("discounts.seniorCitizenEnabled")}
              defaultChecked={true}
            />
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="seniorCitizenEnabled"
                className="text-sm font-semibold text-gray-700 cursor-pointer"
              >
                Senior Citizen Discount
              </Label>
              <p className="text-xs text-gray-600">
                Enable this to allow senior citizens (60+) to avail of a discount
              </p>
              {seniorCitizenEnabled && (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-20"
                    {...register("discounts.seniorCitizenPercentage", { valueAsNumber: true })}
                    defaultValue={20}
                  />
                  <span className="text-sm text-gray-600">% off</span>
                </div>
              )}
            </div>
          </div>

          {/* PWD Discount */}
          <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              id="pwdEnabled"
              {...register("discounts.pwdEnabled")}
              defaultChecked={true}
            />
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="pwdEnabled"
                className="text-sm font-semibold text-gray-700 cursor-pointer"
              >
                PWD (Person with Disability) Discount
              </Label>
              <p className="text-xs text-gray-600">
                Enable this to allow persons with disabilities to avail of a discount
              </p>
              {pwdEnabled && (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-20"
                    {...register("discounts.pwdPercentage", { valueAsNumber: true })}
                    defaultValue={20}
                  />
                  <span className="text-sm text-gray-600">% off</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Important Information</h4>
            <ul className="text-sm text-blue-800 mt-1 list-disc list-inside">
              <li>Senior citizens must present a valid Senior Citizen ID upon check-in</li>
              <li>PWD guests must present a valid PWD ID upon check-in</li>
              <li>Discounts cannot be combined unless explicitly enabled</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountsSection;
