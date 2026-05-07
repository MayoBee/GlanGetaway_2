import { useForm, Controller } from "react-hook-form";
import { HotelFormData } from "./ManageHotelForm";
import { useState, useEffect } from "react";
import { Save, X, Users, Ticket } from "lucide-react";

// Extended form data type for admin editing
interface ExtendedHotelFormData extends HotelFormData {
  roomsIncludedEntranceFee?: boolean;
  roomsAdultCount?: number;
  roomsChildCount?: number;
  cottagesIncludedEntranceFee?: boolean;
  cottagesAdultCount?: number;
  cottagesChildCount?: number;
}

interface EditHotelFormProps {
  hotelId: string;
  initialData?: HotelFormData;
  onSave: (data: HotelFormData) => void;
}

const EditHotelForm = ({ hotelId, initialData, onSave }: EditHotelFormProps) => {
  const methods = useForm<ExtendedHotelFormData>({
    defaultValues: initialData || {}
  });
  const { control, setValue, watch, handleSubmit, formState: { errors } } = methods;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch for entrance fee data
  const watchedData = watch();

  useEffect(() => {
    if (initialData) {
      // Reset form with initial data
      Object.keys(initialData).forEach(key => {
        const value = initialData[key as keyof HotelFormData];
        if (value !== undefined) {
          setValue(key as any, value);
        }
      });

      // Set extended fields based on existing data
      const roomsEnabled = initialData.rooms?.some(room => room.includedEntranceFee?.enabled);
      const cottagesEnabled = initialData.cottages?.some(cottage => cottage.includedEntranceFee?.enabled);

      if (roomsEnabled) {
        setValue('roomsIncludedEntranceFee', true);
        const firstRoomWithFee = initialData.rooms?.find(room => room.includedEntranceFee?.enabled);
        if (firstRoomWithFee?.includedEntranceFee) {
          setValue('roomsAdultCount', firstRoomWithFee.includedEntranceFee.adultCount || 0);
          setValue('roomsChildCount', firstRoomWithFee.includedEntranceFee.childCount || 0);
        }
      }

      if (cottagesEnabled) {
        setValue('cottagesIncludedEntranceFee', true);
        const firstCottageWithFee = initialData.cottages?.find(cottage => cottage.includedEntranceFee?.enabled);
        if (firstCottageWithFee?.includedEntranceFee) {
          setValue('cottagesAdultCount', firstCottageWithFee.includedEntranceFee.adultCount || 0);
          setValue('cottagesChildCount', firstCottageWithFee.includedEntranceFee.childCount || 0);
        }
      }
    }
  }, [initialData, setValue]);

  const onFormSubmit = async (data: ExtendedHotelFormData) => {
    setIsSubmitting(true);
    try {
      // Transform extended data to standard HotelFormData
      const transformedData: HotelFormData = {
        ...data,
        rooms: data.rooms?.map(room => ({
          ...room,
          includedEntranceFee: data.roomsIncludedEntranceFee ? {
            enabled: true,
            adultCount: data.roomsAdultCount || 0,
            childCount: data.roomsChildCount || 0,
          } : { enabled: false, adultCount: 0, childCount: 0 }
        })),
        cottages: data.cottages?.map(cottage => ({
          ...cottage,
          includedEntranceFee: data.cottagesIncludedEntranceFee ? {
            enabled: true,
            adultCount: data.cottagesAdultCount || 0,
            childCount: data.cottagesChildCount || 0,
          } : { enabled: false, adultCount: 0, childCount: 0 }
        }))
      };

      // Remove extended fields
      delete (transformedData as any).roomsIncludedEntranceFee;
      delete (transformedData as any).roomsAdultCount;
      delete (transformedData as any).roomsChildCount;
      delete (transformedData as any).cottagesIncludedEntranceFee;
      delete (transformedData as any).cottagesAdultCount;
      delete (transformedData as any).cottagesChildCount;

      await onSave(transformedData);
    } catch (error) {
      console.error('Error saving hotel:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Resort</h2>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="p-2 text-gray-600 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resort Name
              </label>
              <input
                {...control.register("name")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., McJorn Shoreline Beach Resort"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...control.register("description")}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your resort..."
              />
            </div>
          </div>
        </div>

        {/* Included Entrance Fee Settings */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            <Users className="w-5 h-5 inline mr-2" />
            Included Entrance Fees
          </h3>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-700 mb-2">
                <strong>✅ Enable Free Entrance</strong>
                </p>
              <p className="text-xs text-blue-600">
                When enabled, guests booking this accommodation will get free entrance fees for the specified number of adults and children.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enable Free Entrance for Rooms
                </label>
                <Controller
                  name="roomsIncludedEntranceFee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Enable free entrance for all rooms
                      </label>
                    </div>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Adults per Room
                </label>
                <Controller
                  name="roomsAdultCount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Children per Room
                </label>
                <Controller
                  name="roomsChildCount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enable Free Entrance for Cottages
                </label>
                <Controller
                  name="cottagesIncludedEntranceFee"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label className="text-sm text-gray-700">
                        Enable free entrance for all cottages
                      </label>
                    </div>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Adults per Cottage
                </label>
                <Controller
                  name="cottagesAdultCount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 6"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Children per Cottage
                </label>
                <Controller
                  name="cottagesChildCount"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      min="0"
                      max="20"
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 0"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Current Status Display */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            <Ticket className="w-5 h-5 inline mr-2" />
            Current Entrance Fee Status
          </h3>
          
          <div className="space-y-2">
            {watchedData.rooms?.map((room: any, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{room.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    room.includedEntranceFee?.enabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {room.includedEntranceFee?.enabled 
                      ? `✅ ${room.includedEntranceFee.adultCount} adults free` 
                      : '❌ Entrance fees apply'}
                  </span>
                </div>
              </div>
            ))}

            {watchedData.cottages?.map((cottage: any, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{cottage.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    cottage.includedEntranceFee?.enabled 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cottage.includedEntranceFee?.enabled 
                      ? `✅ ${cottage.includedEntranceFee.adultCount} adults free` 
                      : '❌ Entrance fees apply'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditHotelForm;
