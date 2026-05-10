import { useState, useEffect } from "react";
import axiosInstance from "../../../shared/auth/api-client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "../../../shared/ui/card";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { Checkbox } from "../../../shared/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "../../../shared/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../../../shared/ui/select";
import { 
  Trash2, 
  Plus, 
  Copy, 
  Check, 
  Tag, 
  Percent, 
  RefreshCw,
  Save,
  AlertCircle
} from "lucide-react";
import { generatePromoCode, CustomDiscount } from "../../../shared/lib/discountCalculation";

interface DiscountConfig {
  seniorCitizenEnabled: boolean;
  seniorCitizenPercentage: number;
  pwdEnabled: boolean;
  pwdPercentage: number;
  customDiscounts: CustomDiscount[];
}

interface DiscountConfigProps {
  hotelId?: string;
  onSave?: (config: DiscountConfig) => void;
}

const defaultConfig: DiscountConfig = {
  seniorCitizenEnabled: true,
  seniorCitizenPercentage: 20,
  pwdEnabled: true,
  pwdPercentage: 20,
  customDiscounts: []
};

const DiscountConfig = ({ hotelId, onSave }: DiscountConfigProps) => {
  const [config, setConfig] = useState<DiscountConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isAddDiscountOpen, setIsAddDiscountOpen] = useState(false);
  const [newDiscountName, setNewDiscountName] = useState("");
  const [newDiscountPercentage, setNewDiscountPercentage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (hotelId) {
      fetchDiscountConfig();
    }
  }, [hotelId]);

  const fetchDiscountConfig = async () => {
    if (!hotelId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get(`/api/hotels/${hotelId}/discounts`);
      if (response.data.success && response.data.data) {
        setConfig(response.data.data);
      }
    } catch (err: any) {
      console.error("Error fetching discount config:", err);
      // Use default config if API fails
      setError("Failed to load discount settings. Using defaults.");
    } finally {
      setLoading(false);
    }
  };

  const saveDiscountConfig = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (hotelId) {
        await axiosInstance.put(`/api/hotels/${hotelId}/discounts`, config);
      }
      
      setSuccess("Discount settings saved successfully!");
      onSave?.(config);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving discount config:", err);
      setError(err.response?.data?.message || "Failed to save discount settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSeniorCitizen = (checked: boolean) => {
    setConfig(prev => ({ ...prev, seniorCitizenEnabled: checked }));
  };

  const handleSeniorCitizenPercentageChange = (value: string) => {
    const percentage = parseInt(value) || 0;
    setConfig(prev => ({ ...prev, seniorCitizenPercentage: Math.min(100, Math.max(0, percentage)) }));
  };

  const handleTogglePWD = (checked: boolean) => {
    setConfig(prev => ({ ...prev, pwdEnabled: checked }));
  };

  const handlePWDPercentageChange = (value: string) => {
    const percentage = parseInt(value) || 0;
    setConfig(prev => ({ ...prev, pwdPercentage: Math.min(100, Math.max(0, percentage)) }));
  };

  const handleAddCustomDiscount = () => {
    if (!newDiscountName.trim()) {
      setError("Please enter a discount name");
      return;
    }

    const newDiscount: CustomDiscount = {
      id: Date.now().toString(),
      name: newDiscountName.trim(),
      percentage: newDiscountPercentage,
      promoCode: generatePromoCode(8),
      isEnabled: true
    };

    setConfig(prev => ({
      ...prev,
      customDiscounts: [...prev.customDiscounts, newDiscount]
    }));

    // Reset form
    setNewDiscountName("");
    setNewDiscountPercentage(10);
    setIsAddDiscountOpen(false);
    setError(null);
  };

  const handleDeleteCustomDiscount = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customDiscounts: prev.customDiscounts.filter(d => d.id !== id)
    }));
  };

  const handleToggleCustomDiscount = (id: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      customDiscounts: prev.customDiscounts.map(d => 
        d.id === id ? { ...d, isEnabled: enabled } : d
      )
    }));
  };

  const handleRegeneratePromoCode = (id: string) => {
    setConfig(prev => ({
      ...prev,
      customDiscounts: prev.customDiscounts.map(d => 
        d.id === id ? { ...d, promoCode: generatePromoCode(8) } : d
      )
    }));
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading discount settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Standard Discounts Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-600" />
            Standard Discounts
          </CardTitle>
          <CardDescription>
            Configure mandatory discounts for senior citizens and persons with disabilities (PWD)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Senior Citizen Discount */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="seniorCitizenEnabled"
                  checked={config.seniorCitizenEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggleSeniorCitizen(e.target.checked)}
                />
                <Label htmlFor="seniorCitizenEnabled" className="font-medium">
                  Senior Citizen Discount
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config.seniorCitizenPercentage}
                  onChange={(e) => handleSeniorCitizenPercentageChange(e.target.value)}
                  disabled={!config.seniorCitizenEnabled}
                  className="w-20 text-center"
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Available for guests aged 60 and above with valid ID
            </p>
          </div>

          <hr className="my-4" />

          {/* PWD Discount */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="pwdEnabled"
                  checked={config.pwdEnabled}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTogglePWD(e.target.checked)}
                />
                <Label htmlFor="pwdEnabled" className="font-medium">
                  PWD (Persons with Disabilities) Discount
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config.pwdPercentage}
                  onChange={(e) => handlePWDPercentageChange(e.target.value)}
                  disabled={!config.pwdEnabled}
                  className="w-20 text-center"
                />
                <span className="text-gray-500">%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 ml-7">
              Available for guests with valid PWD ID
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Discounts / Promo Codes Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-purple-600" />
                Custom Discounts & Promo Codes
              </CardTitle>
              <CardDescription>
                Create custom discount categories with unique promo codes
              </CardDescription>
            </div>
            <Dialog open={isAddDiscountOpen} onOpenChange={setIsAddDiscountOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Discount
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Custom Discount</DialogTitle>
                  <DialogDescription>
                    Create a custom discount category with a unique promo code
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountName">Discount Name</Label>
                    <Input
                      id="discountName"
                      placeholder="e.g., Sports Club Member, Government Employee"
                      value={newDiscountName}
                      onChange={(e) => setNewDiscountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercentage">Discount Percentage</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="discountPercentage"
                        type="number"
                        min="1"
                        max="100"
                        value={newDiscountPercentage}
                        onChange={(e) => setNewDiscountPercentage(parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <span className="text-gray-500">%</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDiscountOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCustomDiscount} className="bg-purple-600 hover:bg-purple-700">
                    Create Discount
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {config.customDiscounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No custom discounts created yet</p>
              <p className="text-sm">Click "Add Custom Discount" to create one</p>
            </div>
          ) : (
            <div className="space-y-4">
              {config.customDiscounts.map((discount) => (
                <div 
                  key={discount.id} 
                  className={`border rounded-lg p-4 ${discount.isEnabled ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`discount-${discount.id}`}
                        checked={discount.isEnabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleToggleCustomDiscount(discount.id, e.target.checked)}
                      />
                      <div>
                        <Label 
                          htmlFor={`discount-${discount.id}`} 
                          className={`font-medium ${!discount.isEnabled ? 'text-gray-400' : ''}`}
                        >
                          {discount.name}
                        </Label>
                        <p className="text-sm text-gray-500">{discount.percentage}% discount</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegeneratePromoCode(discount.id)}
                        title="Regenerate promo code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(discount.promoCode)}
                        title="Copy promo code"
                      >
                        {copiedCode === discount.promoCode ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCustomDiscount(discount.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete discount"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 ml-7 flex items-center gap-2">
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {discount.promoCode}
                    </code>
                    {copiedCode === discount.promoCode && (
                      <span className="text-green-600 text-sm">Copied!</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveDiscountConfig} 
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Discount Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DiscountConfig;
