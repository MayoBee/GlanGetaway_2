import React, { useState, useEffect, useRef } from "react";
import { HotelFormData } from "../../types/HotelFormData";
import { HotelType } from "../../types";
import ImageUpload from "../../components/ImageUpload";
import { Bed, Home, Coffee, Package, Plus, X, Users, FileText } from "lucide-react";
import SmartImage from "../../../hotel-booking-frontend/src/components/SmartImage";
import { filterValidImageUrls } from "../../utils/imageUtils";

type Props = {
  hotel?: HotelType;
  onSubmit: (hotelFormData: HotelFormData) => void;
  onCancel?: () => void;
  isLoading: boolean;
};

const ManageHotelForm = ({ onSubmit, onCancel, isLoading, hotel }: Props) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Modal states for custom package items
  const [showCustomRoomModal, setShowCustomRoomModal] = useState(false);
  const [showCustomCottageModal, setShowCustomCottageModal] = useState(false);
  const [showCustomAmenityModal, setShowCustomAmenityModal] = useState(false);
  const [activePackageIndex, setActivePackageIndex] = useState<number | null>(null);
  
  // Temporary state for modal forms
  const [tempCustomRoom, setTempCustomRoom] = useState<any>(null);
  const [tempCustomCottage, setTempCustomCottage] = useState<any>(null);
  const [tempCustomAmenity, setTempCustomAmenity] = useState<any>(null);
  
  const [formData, setFormData] = useState<HotelFormData>({
    name: "",
    city: "",
    country: "",
    barangay: "",
    purok: "",
    description: "",
    type: [],
    dayRate: 0,
    nightRate: 0,
    hasDayRate: false,
    hasNightRate: false,
    dayRateCheckInTime: "08:00",
    dayRateCheckOutTime: "17:00",
    nightRateCheckInTime: "14:00",
    nightRateCheckOutTime: "12:00",
    hasNightRateTimeRestrictions: false,
    starRating: 3,
    facilities: [],
    imageUrls: [],
    contact: {
      phone: "",
      email: "",
      website: "",
      facebook: "",
      instagram: "",
      tiktok: "",
    },
    policies: {
      checkInTime: "",
      checkOutTime: "",
      dayCheckInTime: "",
      dayCheckOutTime: "",
      nightCheckInTime: "",
      nightCheckOutTime: "",
      resortPolicies: [],
    },
    amenities: [],
    rooms: [],
    cottages: [],
    discounts: {
      seniorCitizenEnabled: true,
      seniorCitizenPercentage: 20,
      pwdEnabled: true,
      pwdPercentage: 20,
    },
    packages: [],
    isFeatured: false,
    adultEntranceFee: {
      dayRate: 0,
      nightRate: 0,
      pricingModel: "per_head",
      groupQuantity: 1,
    },
    childEntranceFee: [],
    downPaymentPercentage: 50,
    gcashNumber: "",
  });

  // State for image previews
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear image previews when hotel data changes (for edit mode) or component unmounts
  useEffect(() => {
    return () => {
      // Clear preview URLs on cleanup
      setImagePreviewUrls([]);
      setSelectedFiles([]);
    };
  }, []);

  // File handler function - simplified and fixed
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== FILE SELECT TRIGGERED ===');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }
    console.log(`Files selected: ${files.length}`);

    const fileArray = Array.from(files);
    const existingImages = formData.imageUrls?.length || 0;
    const currentNewImages = imagePreviewUrls.length;
    const totalAfterAdd = existingImages + currentNewImages + fileArray.length;

    // Check if adding these files would exceed the 6-image limit
    if (totalAfterAdd > 6) {
      alert(`You can only upload a maximum of 6 images. You currently have ${existingImages} existing + ${currentNewImages} new = ${existingImages + currentNewImages}/6 images. You can add ${6 - (existingImages + currentNewImages)} more image(s).`);
      e.target.value = ''; // Clear the file input
      return;
    }

    // Process files and create previews
    const newPreviewUrls: string[] = [];
    const validFiles: File[] = [];
    let processedCount = 0;

    fileArray.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`File "${file.name}" is not an image and will be skipped.`);
        processedCount++;
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 5MB and will be skipped.`);
        processedCount++;
        return;
      }

      validFiles.push(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        newPreviewUrls.push(result);
        processedCount++;

        // When all files are processed, update state
        if (processedCount === fileArray.length) {
          setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
          setSelectedFiles(prev => [...prev, ...validFiles]);
          handleInputChange('imageFiles', validFiles);
        }
      };
      reader.onerror = () => {
        console.error(`Error reading file: ${file.name}`);
        processedCount++;
      };
      reader.readAsDataURL(file);
    });

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  // Clear image previews when hotel data changes (for edit mode) or component unmounts
  useEffect(() => {
    return () => {
      setImagePreviewUrls([]);
    };
  }, [hotel]);

  useEffect(() => {
    if (hotel) {
      console.log('=== MANAGE HOTEL FORM: Loading hotel data', hotel._id);

      // Check for saved draft first
      const key = `hotelFormDraft-edit-${hotel._id}`;
      const savedData = localStorage.getItem(key);
      let draftData: any = null;
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Check if draft is not older than 7 days
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (parsedData.timestamp && Date.now() - parsedData.timestamp < sevenDaysMs) {
            draftData = parsedData;
          } else {
            // Clean up old draft
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.error('Error loading saved form data:', e);
        }
      }

      let formData: HotelFormData;
      if (draftData) {
        // Use draft data, but update imageUrls if hotel has newer ones or something
        formData = { ...draftData };
        // Optionally merge imageUrls from hotel if not in draft
        if (!draftData.imageUrls && hotel.imageUrls) {
          formData.imageUrls = filterValidImageUrls(hotel.imageUrls);
        }
      } else {
        // Convert HotelType to HotelFormData format
        formData = {
          // Basic fields from HotelType
          name: hotel.name || "",
          city: hotel.city || "",
          country: hotel.country || "",
          barangay: "",
          purok: "",
          description: hotel.description || "",
          type: hotel.type || [],
          starRating: hotel.starRating || 3,
          facilities: hotel.facilities || [],
          imageUrls: filterValidImageUrls(hotel.imageUrls || []),

          // Handle the new day/night rate fields with fallbacks
          dayRate: hotel.dayRate || 0,
          nightRate: hotel.nightRate || 0,
          hasDayRate: hotel.hasDayRate !== undefined ? hotel.hasDayRate : false,
          hasNightRate: hotel.hasNightRate !== undefined ? hotel.hasNightRate : true,
          dayRateCheckInTime: "08:00",
          dayRateCheckOutTime: "17:00",
          nightRateCheckInTime: "14:00",
          nightRateCheckOutTime: "12:00",
          hasNightRateTimeRestrictions: false,

          // New fields with default values
          contact: (hotel as any)?.contact || {
            phone: "",
            email: "",
            website: "",
            facebook: "",
            instagram: "",
            tiktok: "",
          },
          policies: (hotel as any)?.policies || {
            checkInTime: "",
            checkOutTime: "",
            dayCheckInTime: "",
            dayCheckOutTime: "",
            nightCheckInTime: "",
            nightCheckOutTime: "",
            resortPolicies: [],
          },
          amenities: (hotel as any)?.amenities || [],
          rooms: (hotel as any)?.rooms || [],
          cottages: (hotel as any)?.cottages || [],
          discounts: (hotel as any)?.discounts || {
            seniorCitizenEnabled: true,
            seniorCitizenPercentage: 20,
            pwdEnabled: true,
            pwdPercentage: 20
          },
          packages: (hotel as any)?.packages || [],
          adultEntranceFee: (hotel as any)?.adultEntranceFee || {
            dayRate: 0,
            nightRate: 0,
            pricingModel: "per_head",
            groupQuantity: 1,
          },
          childEntranceFee: (hotel as any)?.childEntranceFee || [],
          downPaymentPercentage: (hotel as any)?.downPaymentPercentage || 50,
          gcashNumber: (hotel as any)?.gcashNumber || "",
          isFeatured: (hotel as any)?.isFeatured || false,
        };
      }

      console.log('=== MANAGE HOTEL FORM: Setting form data', {
        hotelId: hotel._id,
        roomsCount: formData.rooms?.length,
        cottagesCount: formData.cottages?.length,
        amenitiesCount: formData.amenities?.length
      });

      setFormData(formData);
      setCurrentStep(draftData?.currentStep || 1);
    } else {
      // Load from localStorage if no hotel data (add mode)
      const key = 'hotelFormDraft-add-new';
      const savedData = localStorage.getItem(key);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Check if draft is not older than 7 days
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (parsedData.timestamp && Date.now() - parsedData.timestamp < sevenDaysMs) {
            setFormData(parsedData);
            setCurrentStep(parsedData.currentStep || 1);
          } else {
            // Clean up old draft
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.error('Error loading saved form data:', e);
        }
      }
    }
  }, [hotel]);

  // Auto-save to localStorage
  useEffect(() => {
    const mode = hotel ? 'edit' : 'add';
    const id = hotel ? hotel._id : 'new';
    const key = `hotelFormDraft-${mode}-${id}`;
    const dataToSave = {
      ...formData,
      currentStep,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  }, [formData, currentStep, hotel]);

  const handleInputChange = (field: keyof HotelFormData, value: any) => {
    setFormData((prev: HotelFormData) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section: keyof HotelFormData, field: string, value: any) => {
    setFormData((prev: HotelFormData) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Custom Room Modal Functions
  const openCustomRoomModal = (pkgIndex: number) => {
    setActivePackageIndex(pkgIndex);
    setTempCustomRoom({
      id: Date.now().toString(),
      name: "",
      type: "Standard",
      description: "",
      pricePerNight: 0,
      minOccupancy: 1,
      maxOccupancy: 2,
      units: 1,
      amenities: [],
      imageUrl: "",
      imageFile: undefined
    });
    setShowCustomRoomModal(true);
  };

  const saveCustomRoom = () => {
    if (activePackageIndex !== null && tempCustomRoom) {
      const updated = [...formData.packages!];
      updated[activePackageIndex] = {
        ...updated[activePackageIndex],
        customRooms: [...(updated[activePackageIndex].customRooms || []), tempCustomRoom]
      };
      handleInputChange('packages', updated);
      setShowCustomRoomModal(false);
      setTempCustomRoom(null);
      setActivePackageIndex(null);
    }
  };

  // Custom Cottage Modal Functions
  const openCustomCottageModal = (pkgIndex: number) => {
    setActivePackageIndex(pkgIndex);
    setTempCustomCottage({
      id: Date.now().toString(),
      name: "",
      type: "Standard",
      description: "",
      dayRate: 0,
      nightRate: 0,
      minOccupancy: 1,
      maxOccupancy: 4,
      units: 1,
      amenities: [],
      imageUrl: "",
      imageFile: undefined
    });
    setShowCustomCottageModal(true);
  };

  const saveCustomCottage = () => {
    if (activePackageIndex !== null && tempCustomCottage) {
      const updated = [...formData.packages!];
      updated[activePackageIndex] = {
        ...updated[activePackageIndex],
        customCottages: [...(updated[activePackageIndex].customCottages || []), tempCustomCottage]
      };
      handleInputChange('packages', updated);
      setShowCustomCottageModal(false);
      setTempCustomCottage(null);
      setActivePackageIndex(null);
    }
  };

  // Custom Amenity Modal Functions
  const openCustomAmenityModal = (pkgIndex: number) => {
    setActivePackageIndex(pkgIndex);
    setTempCustomAmenity({
      id: Date.now().toString(),
      name: "",
      description: "",
      type: "included" as 'included' | 'addon',
      price: 0,
      quantity: 1,
      imageUrl: "",
      imageFile: undefined
    });
    setShowCustomAmenityModal(true);
  };

  const saveCustomAmenity = () => {
    if (activePackageIndex !== null && tempCustomAmenity) {
      const updated = [...formData.packages!];
      updated[activePackageIndex] = {
        ...updated[activePackageIndex],
        customAmenities: [...(updated[activePackageIndex].customAmenities || []), tempCustomAmenity]
      };
      handleInputChange('packages', updated);
      setShowCustomAmenityModal(false);
      setTempCustomAmenity(null);
      setActivePackageIndex(null);
    }
  };

  const deleteCustomRoom = (pkgIndex: number, roomIndex: number) => {
    const updated = [...formData.packages!];
    updated[pkgIndex] = {
      ...updated[pkgIndex],
      customRooms: updated[pkgIndex].customRooms?.filter((_, i) => i !== roomIndex) || []
    };
    handleInputChange('packages', updated);
  };

  const deleteCustomCottage = (pkgIndex: number, cottageIndex: number) => {
    const updated = [...formData.packages!];
    updated[pkgIndex] = {
      ...updated[pkgIndex],
      customCottages: updated[pkgIndex].customCottages?.filter((_, i) => i !== cottageIndex) || []
    };
    handleInputChange('packages', updated);
  };

  const deleteCustomAmenity = (pkgIndex: number, amenityIndex: number) => {
    const updated = [...formData.packages!];
    updated[pkgIndex] = {
      ...updated[pkgIndex],
      customAmenities: updated[pkgIndex].customAmenities?.filter((_, i) => i !== amenityIndex) || []
    };
    handleInputChange('packages', updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION DEBUG ===');
    console.log('Complete form data:', JSON.stringify(formData, null, 2));

    // Convert units from strings to numbers for consistency
    const processedData = {
      ...formData,
      amenities: formData.amenities?.map((amenity: any) => ({
        ...amenity,
        units: parseInt(String(amenity.units)) || 1
      })),
      cottages: formData.cottages?.map((cottage: any) => ({
        ...cottage,
        units: parseInt(String(cottage.units)) || 1
      })),
      rooms: formData.rooms?.map((room: any) => ({
        ...room,
        units: parseInt(String(room.units)) || 1
      }))
    };

    console.log('Processed form data:', {
      roomsCount: processedData.rooms?.length,
      cottagesCount: processedData.cottages?.length,
      amenitiesCount: processedData.amenities?.length,
      packagesCount: processedData.packages?.length
    });

    onSubmit(processedData);
  };

  const resortTypes = [
    'Beach Resort', 'Mountain Resort', 'City Hotel', 'Spa Resort', 
    'Eco Resort', 'Luxury Resort', 'Budget Hotel', 'Boutique Hotel',
    'Business Hotel', 'Family Resort', 'Adventure Resort', 'Wellness Retreat',
    'Villa', 'Apartment', 'Guest House', 'Resort'
  ];

  const commonFacilities = [
    'WiFi', 'Parking', 'Swimming Pool', 'Restaurant', 'Bar', 'Gym',
    'Spa', 'Conference Room', 'Business Center', 'Room Service',
    'Air Conditioning', 'Heating', 'Elevator', 'Pet Friendly',
    'Beach Access', 'Garden', 'Tennis Court', 'Golf Course',
    'Kids Club', 'Water Sports', 'Airport Shuttle', 'Laundry Service'
  ];

  const steps = [
    { number: 1, title: 'Basic Information' },
    { number: 2, title: 'Rates & Facilities' },
    { number: 3, title: 'Accommodations' },
    { number: 4, title: 'Amenities & Packages' },
    { number: 5, title: 'Contact & Policies' },
    { number: 6, title: 'Images & Review' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number}
              </div>
              {step.number < 6 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          {steps.map((step) => (
            <span key={step.number} className="w-20 text-center">{step.title}</span>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Details Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Resort Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">City/Municipality *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Barangay *</label>
                  <input
                    type="text"
                    value={formData.barangay}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Local administrative division"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Purok *</label>
                  <input
                    type="text"
                    value={formData.purok}
                    onChange={(e) => handleInputChange('purok', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Smaller subdivision within barangay"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Star Rating *</label>
                  <select
                    value={formData.starRating}
                    onChange={(e) => handleInputChange('starRating', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                  >
                    {[1, 2, 3, 4, 5].map(rating => (
                      <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium mb-2 text-gray-700">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Provide a detailed description of your resort, its amenities, and what makes it special..."
                  required
                />
              </div>
            </div>

            {/* Resort Owner Pricing */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Resort Owner Pricing</h3>
              
              {/* Day Rate */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.hasDayRate}
                    onChange={(e) => handleInputChange('hasDayRate', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Day Rate (until 5PM)</span>
                </label>
                {formData.hasDayRate && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Price</label>
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                        <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                        <input
                          type="number"
                          value={formData.dayRate || ''}
                          onChange={(e) => handleInputChange('dayRate', parseFloat(e.target.value) || 0)}
                          className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Check-in Time</label>
                      <input
                        type="time"
                        value={formData.dayRateCheckInTime}
                        onChange={(e) => handleInputChange('dayRateCheckInTime', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        defaultValue="08:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Check-out Time</label>
                      <input
                        type="time"
                        value={formData.dayRateCheckOutTime}
                        onChange={(e) => handleInputChange('dayRateCheckOutTime', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        defaultValue="17:00"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Night Rate */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    checked={formData.hasNightRate}
                    onChange={(e) => handleInputChange('hasNightRate', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Night Rate (24-hour)</span>
                </label>
                {formData.hasNightRate && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Price</label>
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                          <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                          <input
                            type="number"
                            value={formData.nightRate || ''}
                            onChange={(e) => handleInputChange('nightRate', parseFloat(e.target.value) || 0)}
                            className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                    <label className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        checked={formData.hasNightRateTimeRestrictions}
                        onChange={(e) => handleInputChange('hasNightRateTimeRestrictions', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Fixed check-in/out times</span>
                    </label>
                    {formData.hasNightRateTimeRestrictions && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Check-in Time</label>
                          <input
                            type="time"
                            value={formData.nightRateCheckInTime}
                            onChange={(e) => handleInputChange('nightRateCheckInTime', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            defaultValue="14:00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Check-out Time</label>
                          <input
                            type="time"
                            value={formData.nightRateCheckOutTime}
                            onChange={(e) => handleInputChange('nightRateCheckOutTime', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            defaultValue="12:00"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Type Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Property Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {resortTypes.map((type: string) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (formData.type?.includes(type)) {
                        handleInputChange('type', formData.type.filter((t: string) => t !== type));
                      } else {
                        handleInputChange('type', [...(formData.type || []), type]);
                      }
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      formData.type?.includes(type)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {formData.type?.length === 0 && (
                <p className="mt-4 text-red-500 text-sm">At least one property type must be selected</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Rates & Facilities */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Guests Section - Adult Entrance Fees */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Adult Entrance Fees</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Day Rate *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                    <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                    <input
                      type="number"
                      value={formData.adultEntranceFee?.dayRate || ''}
                      onChange={(e) => handleNestedChange('adultEntranceFee', 'dayRate', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Night Rate *</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                    <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                    <input
                      type="number"
                      value={formData.adultEntranceFee?.nightRate || ''}
                      onChange={(e) => handleNestedChange('adultEntranceFee', 'nightRate', parseFloat(e.target.value) || 0)}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Pricing Model</label>
                  <select
                    value={formData.adultEntranceFee?.pricingModel || 'per_head'}
                    onChange={(e) => handleNestedChange('adultEntranceFee', 'pricingModel', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="per_head">Per Head</option>
                    <option value="per_group">Per Group</option>
                  </select>
                </div>
                {formData.adultEntranceFee?.pricingModel === 'per_group' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Group Quantity</label>
                    <input
                      type="number"
                      value={formData.adultEntranceFee?.groupQuantity || 1}
                      onChange={(e) => handleNestedChange('adultEntranceFee', 'groupQuantity', parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      min="1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Child Entrance Fees */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Child Entrance Fees (by Age Group)</h3>
                <button
                  type="button"
                  onClick={() => {
                    const newGroup = {
                      id: Date.now().toString(),
                      minAge: 0,
                      maxAge: 12,
                      dayRate: 0,
                      nightRate: 0,
                      pricingModel: 'per_head' as const,
                      groupQuantity: 1,
                      isConfirmed: false
                    };
                    handleInputChange('childEntranceFee', [...(formData.childEntranceFee || []), newGroup]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Age Group
                </button>
              </div>
              
              {formData.childEntranceFee && formData.childEntranceFee.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No child age groups added yet</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                  <div className="overflow-y-auto space-y-4 pr-2" style={{maxHeight: '200px'}}>
                    {formData.childEntranceFee.map((group, index) => (
                      <div key={group.id} className="border border-gray-200 rounded-lg bg-white p-4">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-800">
                                {group.minAge} - {group.maxAge} years old
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('childEntranceFee', formData.childEntranceFee!.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Card Content - Always Visible */}
                        <div>
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Min Age *</label>
                          <input
                            type="number"
                            value={group.minAge}
                            onChange={(e) => {
                              const updated = [...formData.childEntranceFee!];
                              updated[index] = { ...updated[index], minAge: parseInt(e.target.value) || 0 };
                              handleInputChange('childEntranceFee', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="0"
                            max="18"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Max Age *</label>
                          <input
                            type="number"
                            value={group.maxAge}
                            onChange={(e) => {
                              const updated = [...formData.childEntranceFee!];
                              updated[index] = { ...updated[index], maxAge: parseInt(e.target.value) || 0 };
                              handleInputChange('childEntranceFee', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="0"
                            max="18"
                            required
                          />
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium mb-2 text-gray-700">Day Rate *</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                            <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                            <input
                              type="number"
                              value={group.dayRate}
                              onChange={(e) => {
                                const updated = [...formData.childEntranceFee!];
                                updated[index] = { ...updated[index], dayRate: parseFloat(e.target.value) || 0 };
                                handleInputChange('childEntranceFee', updated);
                              }}
                              className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium mb-2 text-gray-700">Night Rate *</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                            <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                            <input
                              type="number"
                              value={group.nightRate}
                              onChange={(e) => {
                                const updated = [...formData.childEntranceFee!];
                                updated[index] = { ...updated[index], nightRate: parseFloat(e.target.value) || 0 };
                                handleInputChange('childEntranceFee', updated);
                              }}
                              className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Pricing Model</label>
                          <select
                            value={group.pricingModel}
                            onChange={(e) => {
                              const updated = [...formData.childEntranceFee!];
                              updated[index] = { ...updated[index], pricingModel: e.target.value as 'per_head' | 'per_group' };
                              handleInputChange('childEntranceFee', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          >
                            <option value="per_head">Per Head</option>
                            <option value="per_group">Per Group</option>
                          </select>
                        </div>
                        {group.pricingModel === 'per_group' && (
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">Group Qty</label>
                            <input
                              type="number"
                              value={group.groupQuantity || 1}
                              onChange={(e) => {
                                const updated = [...formData.childEntranceFee!];
                                updated[index] = { ...updated[index], groupQuantity: parseInt(e.target.value) || 1 };
                                handleInputChange('childEntranceFee', updated);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                              min="1"
                            />
                          </div>
                        )}
                      </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.childEntranceFee!];
                            updated[index] = { ...updated[index], isConfirmed: !updated[index].isConfirmed };
                            handleInputChange('childEntranceFee', updated);
                          }}
                          className={`px-4 py-2 rounded-lg transition ${
                            group.isConfirmed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {group.isConfirmed ? '✓ Confirmed' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('childEntranceFee', formData.childEntranceFee!.filter((_, i) => i !== index));
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Facilities Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {commonFacilities.map((facility: string) => (
                  <label key={facility} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={formData.facilities?.includes(facility) || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('facilities', [...(formData.facilities || []), facility]);
                        } else {
                          handleInputChange('facilities', formData.facilities?.filter((f: string) => f !== facility) || []);
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{facility}</span>
                  </label>
                ))}
              </div>
              {formData.facilities?.length === 0 && (
                <p className="mt-4 text-red-500 text-sm">At least one facility must be selected</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Accommodations */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Rooms Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Rooms</h3>
                <button
                  type="button"
                  onClick={() => {
                    const newRoom = {
                      id: Date.now().toString(),
                      name: "",
                      type: "Standard",
                      pricePerNight: 0,
                      minOccupancy: 1,
                      maxOccupancy: 2,
                      units: 1,
                      description: "",
                      amenities: [],
                      imageUrl: "",
                      isConfirmed: false
                    };
                    handleInputChange('rooms', [...(formData.rooms || []), newRoom]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Room
                </button>
              </div>
              
              {formData.rooms && formData.rooms.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Bed className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No rooms added yet</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                  <div className="overflow-y-auto space-y-4 pr-2" style={{maxHeight: '200px'}}>
                    {formData.rooms.map((room, index) => (
                      <div key={room.id} className="border border-gray-200 rounded-lg bg-white p-4">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Bed className="w-5 h-5 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-800">
                                {room.name || 'Untitled Room'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('rooms', formData.rooms!.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Card Content - Always Visible */}
                        <div>
                              <ImageUpload
                        value={room.imageUrl}
                        onChange={(url) => {
                          const updated = [...formData.rooms!];
                          updated[index] = { ...updated[index], imageUrl: url };
                          handleInputChange('rooms', updated);
                        }}
                        onFileChange={(file) => {
                          const updated = [...formData.rooms!];
                          updated[index] = { ...updated[index], imageFile: file };
                          handleInputChange('rooms', updated);
                        }}
                        label="Room Image"
                        className="mb-4"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Room Name</label>
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => {
                              const updated = [...formData.rooms!];
                              updated[index] = { ...updated[index], name: e.target.value };
                              handleInputChange('rooms', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
                          <select
                            value={room.type}
                            onChange={(e) => {
                              const updated = [...formData.rooms!];
                              updated[index] = { ...updated[index], type: e.target.value };
                              handleInputChange('rooms', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Deluxe">Deluxe</option>
                            <option value="Suite">Suite</option>
                            <option value="Family">Family</option>
                            <option value="Penthouse">Penthouse</option>
                          </select>
                        </div>
                        <div className="relative">
                          <label className="block text-sm font-medium mb-2 text-gray-700">Price/Night</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                            <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                            <input
                              type="number"
                              value={room.pricePerNight}
                              onChange={(e) => {
                                const updated = [...formData.rooms!];
                                updated[index] = { ...updated[index], pricePerNight: parseFloat(e.target.value) || 0 };
                                handleInputChange('rooms', updated);
                              }}
                              className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Min Occupancy</label>
                          <input
                            type="number"
                            value={room.minOccupancy}
                            onChange={(e) => {
                              const updated = [...formData.rooms!];
                              updated[index] = { ...updated[index], minOccupancy: parseInt(e.target.value) || 1 };
                              handleInputChange('rooms', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Max Occupancy</label>
                          <input
                            type="number"
                            value={room.maxOccupancy}
                            onChange={(e) => {
                              const updated = [...formData.rooms!];
                              updated[index] = { ...updated[index], maxOccupancy: parseInt(e.target.value) || 2 };
                              handleInputChange('rooms', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Units Available</label>
                          <input
                            type="number"
                            value={room.units}
                            onChange={(e) => {
                              const updated = [...formData.rooms!];
                              updated[index] = { ...updated[index], units: parseInt(e.target.value) || 1 };
                              handleInputChange('rooms', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                        <textarea
                          value={room.description}
                          onChange={(e) => {
                            const updated = [...formData.rooms!];
                            updated[index] = { ...updated[index], description: e.target.value };
                            handleInputChange('rooms', updated);
                          }}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.rooms!];
                            updated[index] = { ...updated[index], isConfirmed: !updated[index].isConfirmed };
                            handleInputChange('rooms', updated);
                          }}
                          className={`px-4 py-2 rounded-lg transition ${
                            room.isConfirmed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {room.isConfirmed ? '✓ Confirmed' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('rooms', formData.rooms!.filter((_, i) => i !== index));
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cottages Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Cottages</h3>
                <button
                  type="button"
                  onClick={() => {
                    const newCottage = {
                      id: Date.now().toString(),
                      name: "",
                      type: "Standard",
                      pricePerNight: 0,
                      dayRate: 0,
                      nightRate: 0,
                      hasDayRate: true,
                      hasNightRate: true,
                      minOccupancy: 1,
                      maxOccupancy: 10,
                      units: 1,
                      description: "",
                      amenities: [],
                      imageUrl: "",
                      isConfirmed: false
                    };
                    handleInputChange('cottages', [...(formData.cottages || []), newCottage]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Cottage
                </button>
              </div>
              
              {formData.cottages && formData.cottages.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Home className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No cottages added yet</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                  <div className="overflow-y-auto space-y-4 pr-2" style={{maxHeight: '200px'}}>
                    {formData.cottages.map((cottage, index) => (
                      <div key={cottage.id} className="border border-gray-200 rounded-lg bg-white p-4">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Home className="w-5 h-5 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-800">
                                {cottage.name || 'Untitled Cottage'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('cottages', formData.cottages!.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Card Content - Always Visible */}
                        <div>
                              <ImageUpload
                        value={cottage.imageUrl}
                        onChange={(url) => {
                          const updated = [...formData.cottages!];
                          updated[index] = { ...updated[index], imageUrl: url };
                          handleInputChange('cottages', updated);
                        }}
                        onFileChange={(file) => {
                          const updated = [...formData.cottages!];
                          updated[index] = { ...updated[index], imageFile: file };
                          handleInputChange('cottages', updated);
                        }}
                        label="Cottage Image"
                        className="mb-4"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Cottage Name</label>
                          <input
                            type="text"
                            value={cottage.name}
                            onChange={(e) => {
                              const updated = [...formData.cottages!];
                              updated[index] = { ...updated[index], name: e.target.value };
                              handleInputChange('cottages', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
                          <select
                            value={cottage.type}
                            onChange={(e) => {
                              const updated = [...formData.cottages!];
                              updated[index] = { ...updated[index], type: e.target.value };
                              handleInputChange('cottages', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Premium">Premium</option>
                            <option value="VIP">VIP</option>
                            <option value="Family">Family</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Units Available</label>
                          <input
                            type="number"
                            value={cottage.units}
                            onChange={(e) => {
                              const updated = [...formData.cottages!];
                              updated[index] = { ...updated[index], units: parseInt(e.target.value) || 1 };
                              handleInputChange('cottages', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={cottage.hasDayRate}
                              onChange={(e) => {
                                const updated = [...formData.cottages!];
                                updated[index] = { ...updated[index], hasDayRate: e.target.checked };
                                handleInputChange('cottages', updated);
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">Day Rate</span>
                          </label>
                          {cottage.hasDayRate && (
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                              <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                              <input
                                type="number"
                                value={cottage.dayRate}
                                onChange={(e) => {
                                  const updated = [...formData.cottages!];
                                  updated[index] = { ...updated[index], dayRate: parseFloat(e.target.value) || 0 };
                                  handleInputChange('cottages', updated);
                                }}
                                className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                                min="0"
                                required
                              />
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={cottage.hasNightRate}
                              onChange={(e) => {
                                const updated = [...formData.cottages!];
                                updated[index] = { ...updated[index], hasNightRate: e.target.checked };
                                handleInputChange('cottages', updated);
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">Night Rate</span>
                          </label>
                          {cottage.hasNightRate && (
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                              <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                              <input
                                type="number"
                                value={cottage.nightRate}
                                onChange={(e) => {
                                  const updated = [...formData.cottages!];
                                  updated[index] = { ...updated[index], nightRate: parseFloat(e.target.value) || 0 };
                                  handleInputChange('cottages', updated);
                                }}
                                className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                                min="0"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Min Occupancy</label>
                          <input
                            type="number"
                            value={cottage.minOccupancy}
                            onChange={(e) => {
                              const updated = [...formData.cottages!];
                              updated[index] = { ...updated[index], minOccupancy: parseInt(e.target.value) || 1 };
                              handleInputChange('cottages', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Max Occupancy</label>
                          <input
                            type="number"
                            value={cottage.maxOccupancy}
                            onChange={(e) => {
                              const updated = [...formData.cottages!];
                              updated[index] = { ...updated[index], maxOccupancy: parseInt(e.target.value) || 10 };
                              handleInputChange('cottages', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                        <textarea
                          value={cottage.description}
                          onChange={(e) => {
                            const updated = [...formData.cottages!];
                            updated[index] = { ...updated[index], description: e.target.value };
                            handleInputChange('cottages', updated);
                          }}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.cottages!];
                            updated[index] = { ...updated[index], isConfirmed: !updated[index].isConfirmed };
                            handleInputChange('cottages', updated);
                          }}
                          className={`px-4 py-2 rounded-lg transition ${
                            cottage.isConfirmed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {cottage.isConfirmed ? '✓ Confirmed' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('cottages', formData.cottages!.filter((_, i) => i !== index));
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Amenities & Packages */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Amenities Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Amenities</h3>
                <button
                  type="button"
                  onClick={() => {
                    const newAmenity = {
                      id: Date.now().toString(),
                      name: "",
                      description: "",
                      price: 0,
                      isFree: true,
                      category: "General",
                      isConfirmed: false
                    };
                    handleInputChange('amenities', [...(formData.amenities || []), newAmenity]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + Add Amenity
                </button>
              </div>
              
              {formData.amenities && formData.amenities.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No amenities added yet</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                  <div className="overflow-y-auto space-y-4 pr-2" style={{maxHeight: '200px'}}>
                    {formData.amenities.map((amenity, index) => (
                      <div key={amenity.id} className="border border-gray-200 rounded-lg bg-white p-4">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Coffee className="w-5 h-5 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-800">
                                {amenity.name || 'Untitled Amenity'}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleInputChange('amenities', formData.amenities!.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Card Content - Always Visible */}
                        <div>
                              <ImageUpload
                        value={amenity.imageUrl}
                        onChange={(url) => {
                          const updated = [...formData.amenities!];
                          updated[index] = { ...updated[index], imageUrl: url };
                          handleInputChange('amenities', updated);
                        }}
                        onFileChange={(file) => {
                          const updated = [...formData.amenities!];
                          updated[index] = { ...updated[index], imageFile: file };
                          handleInputChange('amenities', updated);
                        }}
                        label="Amenity Image"
                        className="mb-4"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Amenity Name</label>
                          <input
                            type="text"
                            value={amenity.name}
                            onChange={(e) => {
                              const updated = [...formData.amenities!];
                              updated[index] = { ...updated[index], name: e.target.value };
                              handleInputChange('amenities', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
                          <select
                            value={amenity.category}
                            onChange={(e) => {
                              const updated = [...formData.amenities!];
                              updated[index] = { ...updated[index], category: e.target.value };
                              handleInputChange('amenities', updated);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          >
                            <option value="General">General</option>
                            <option value="Wellness">Wellness</option>
                            <option value="Sports">Sports</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Food">Food & Beverage</option>
                            <option value="Transport">Transport</option>
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center space-x-2 mb-2">
                            <input
                              type="checkbox"
                              checked={amenity.isFree}
                              onChange={(e) => {
                                const updated = [...formData.amenities!];
                                updated[index] = { ...updated[index], isFree: e.target.checked };
                                handleInputChange('amenities', updated);
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">Free</span>
                          </label>
                          {!amenity.isFree && (
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                              <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                              <input
                                type="number"
                                value={amenity.price}
                                onChange={(e) => {
                                  const updated = [...formData.amenities!];
                                  updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                  handleInputChange('amenities', updated);
                                }}
                                className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                                min="0"
                                required
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                        <textarea
                          value={amenity.description}
                          onChange={(e) => {
                            const updated = [...formData.amenities!];
                            updated[index] = { ...updated[index], description: e.target.value };
                            handleInputChange('amenities', updated);
                          }}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.amenities!];
                            updated[index] = { ...updated[index], isConfirmed: !updated[index].isConfirmed };
                            handleInputChange('amenities', updated);
                          }}
                          className={`px-4 py-2 rounded-lg transition ${
                            amenity.isConfirmed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {amenity.isConfirmed ? '✓ Confirmed' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('amenities', formData.amenities!.filter((_, i) => i !== index));
                          }}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Packages Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Packages</h3>
                <button
                  type="button"
                  onClick={() => {
                    const newPackage = {
                      id: Date.now().toString(),
                      name: "",
                      description: "",
                      price: 0,
                      imageUrl: "",
                      includedRooms: [],
                      includedCottages: [],
                      includedAmenities: [],
                      customAddOns: [],
                      customRooms: [],
                      customCottages: [],
                      customAmenities: [],
                      includedAdultEntranceFee: false,
                      includedChildEntranceFee: false,
                      isConfirmed: false
                    };
                    handleInputChange('packages', [...(formData.packages || []), newPackage]);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                >
                  <span className="text-lg">+</span> Add Package
                </button>
              </div>
              
              {formData.packages && formData.packages.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No packages added yet</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                  <div className="overflow-y-auto space-y-4 pr-2" style={{maxHeight: '200px'}}>
                    {formData.packages.map((pkg, pkgIndex) => (
                      <div key={pkg.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                      {/* Package Header with Delete Button */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => {
                              const updated = [...formData.packages!];
                              updated[pkgIndex] = { ...updated[pkgIndex], name: e.target.value };
                              handleInputChange('packages', updated);
                            }}
                            className="w-full text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            placeholder="Package Name (e.g., Summer Getaway Package)"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('packages', formData.packages!.filter((_, i) => i !== pkgIndex));
                          }}
                          className="ml-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition flex-shrink-0"
                        >
                          ×
                        </button>
                      </div>

                      {/* Basic Package Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="relative">
                          <label className="block text-sm font-medium mb-2 text-gray-700">Package Price (₱)</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition">
                            <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                            <input
                              type="number"
                              value={pkg.price}
                              onChange={(e) => {
                                const updated = [...formData.packages!];
                                updated[pkgIndex] = { ...updated[pkgIndex], price: parseFloat(e.target.value) || 0 };
                                handleInputChange('packages', updated);
                              }}
                              className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                              min="0"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Package Image</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const updated = [...formData.packages!];
                                updated[pkgIndex] = { ...updated[pkgIndex], imageFile: file };
                                handleInputChange('packages', updated);
                              }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                        <textarea
                          value={pkg.description}
                          onChange={(e) => {
                            const updated = [...formData.packages!];
                            updated[pkgIndex] = { ...updated[pkgIndex], description: e.target.value };
                            handleInputChange('packages', updated);
                          }}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          placeholder="Describe what this package includes..."
                        />
                      </div>

                      {/* Inventory Integration - Rooms */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>🛏️</span> Included Rooms
                        </h4>
                        {formData.rooms && formData.rooms.length > 0 ? (
                          <div className="space-y-2">
                            {formData.rooms.map((room) => {
                              const includedRoom = pkg.includedRooms?.find(ir => ir.roomId === room.id);
                              return (
                                <div key={room.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                  <input
                                    type="checkbox"
                                    checked={!!includedRoom}
                                    onChange={(e) => {
                                      const updated = [...formData.packages!];
                                      if (e.target.checked) {
                                        updated[pkgIndex] = {
                                          ...updated[pkgIndex],
                                          includedRooms: [...(updated[pkgIndex].includedRooms || []), { roomId: room.id, units: 1 }]
                                        };
                                      } else {
                                        updated[pkgIndex] = {
                                          ...updated[pkgIndex],
                                          includedRooms: updated[pkgIndex].includedRooms?.filter(ir => ir.roomId !== room.id) || []
                                        };
                                      }
                                      handleInputChange('packages', updated);
                                    }}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="flex-1 text-sm">{room.name}</span>
                                  <span className="text-xs text-gray-500">₱{room.pricePerNight}/night</span>
                                  {includedRoom && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">Units:</span>
                                      <input
                                        type="number"
                                        value={includedRoom.units}
                                        onChange={(e) => {
                                          const updated = [...formData.packages!];
                                          const roomIndex = updated[pkgIndex].includedRooms?.findIndex(ir => ir.roomId === room.id);
                                          if (roomIndex !== undefined && roomIndex >= 0) {
                                            updated[pkgIndex].includedRooms![roomIndex] = {
                                              ...updated[pkgIndex].includedRooms![roomIndex],
                                              units: Math.min(parseInt(e.target.value) || 1, room.units)
                                            };
                                            handleInputChange('packages', updated);
                                          }
                                        }}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="1"
                                        max={room.units}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No rooms available in inventory</p>
                        )}
                      </div>

                      {/* Inventory Integration - Cottages */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>🏠</span> Included Cottages
                        </h4>
                        {formData.cottages && formData.cottages.length > 0 ? (
                          <div className="space-y-2">
                            {formData.cottages.map((cottage) => {
                              const includedCottage = pkg.includedCottages?.find(ic => ic.cottageId === cottage.id);
                              return (
                                <div key={cottage.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                  <input
                                    type="checkbox"
                                    checked={!!includedCottage}
                                    onChange={(e) => {
                                      const updated = [...formData.packages!];
                                      if (e.target.checked) {
                                        updated[pkgIndex] = {
                                          ...updated[pkgIndex],
                                          includedCottages: [...(updated[pkgIndex].includedCottages || []), { cottageId: cottage.id, units: 1 }]
                                        };
                                      } else {
                                        updated[pkgIndex] = {
                                          ...updated[pkgIndex],
                                          includedCottages: updated[pkgIndex].includedCottages?.filter(ic => ic.cottageId !== cottage.id) || []
                                        };
                                      }
                                      handleInputChange('packages', updated);
                                    }}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="flex-1 text-sm">{cottage.name}</span>
                                  <span className="text-xs text-gray-500">₱{cottage.dayRate}/day</span>
                                  {includedCottage && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">Units:</span>
                                      <input
                                        type="number"
                                        value={includedCottage.units}
                                        onChange={(e) => {
                                          const updated = [...formData.packages!];
                                          const cottageIndex = updated[pkgIndex].includedCottages?.findIndex(ic => ic.cottageId === cottage.id);
                                          if (cottageIndex !== undefined && cottageIndex >= 0) {
                                            updated[pkgIndex].includedCottages![cottageIndex] = {
                                              ...updated[pkgIndex].includedCottages![cottageIndex],
                                              units: Math.min(parseInt(e.target.value) || 1, cottage.units)
                                            };
                                            handleInputChange('packages', updated);
                                          }
                                        }}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="1"
                                        max={cottage.units}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No cottages available in inventory</p>
                        )}
                      </div>

                      {/* Inventory Integration - Amenities */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <span>✨</span> Included Amenities
                        </h4>
                        {formData.amenities && formData.amenities.length > 0 ? (
                          <div className="space-y-2">
                            {formData.amenities.map((amenity) => {
                              const includedAmenity = pkg.includedAmenities?.find(ia => ia.amenityId === amenity.id);
                              return (
                                <div key={amenity.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                  <input
                                    type="checkbox"
                                    checked={!!includedAmenity}
                                    onChange={(e) => {
                                      const updated = [...formData.packages!];
                                      if (e.target.checked) {
                                        updated[pkgIndex] = {
                                          ...updated[pkgIndex],
                                          includedAmenities: [...(updated[pkgIndex].includedAmenities || []), { amenityId: amenity.id, quantity: 1 }]
                                        };
                                      } else {
                                        updated[pkgIndex] = {
                                          ...updated[pkgIndex],
                                          includedAmenities: updated[pkgIndex].includedAmenities?.filter(ia => ia.amenityId !== amenity.id) || []
                                        };
                                      }
                                      handleInputChange('packages', updated);
                                    }}
                                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  <span className="flex-1 text-sm">{amenity.name}</span>
                                  <span className="text-xs text-gray-500">{amenity.isFree ? 'Free' : `₱${amenity.price}`}</span>
                                  {includedAmenity && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500">Qty:</span>
                                      <input
                                        type="number"
                                        value={includedAmenity.quantity}
                                        onChange={(e) => {
                                          const updated = [...formData.packages!];
                                          const amenityIndex = updated[pkgIndex].includedAmenities?.findIndex(ia => ia.amenityId === amenity.id);
                                          if (amenityIndex !== undefined && amenityIndex >= 0) {
                                            updated[pkgIndex].includedAmenities![amenityIndex] = {
                                              ...updated[pkgIndex].includedAmenities![amenityIndex],
                                              quantity: parseInt(e.target.value) || 1
                                            };
                                            handleInputChange('packages', updated);
                                          }
                                        }}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        min="1"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No amenities available in inventory</p>
                        )}
                      </div>

                      {/* Custom Add-ons */}
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>➕</span> Custom Add-ons (Package-Exclusive)
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.packages!];
                              updated[pkgIndex] = {
                                ...updated[pkgIndex],
                                customAddOns: [...(updated[pkgIndex].customAddOns || []), {
                                  id: Date.now().toString(),
                                  name: "",
                                  description: "",
                                  price: 0
                                }]
                              };
                              handleInputChange('packages', updated);
                            }}
                            className="text-sm px-3 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 transition"
                          >
                            + Add Custom
                          </button>
                        </div>
                        {pkg.customAddOns && pkg.customAddOns.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.customAddOns.map((addOn, addOnIndex) => (
                              <div key={addOn.id} className="flex items-start gap-2 p-2 bg-white rounded border">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={addOn.name}
                                    onChange={(e) => {
                                      const updated = [...formData.packages!];
                                      updated[pkgIndex].customAddOns![addOnIndex] = { ...addOn, name: e.target.value };
                                      handleInputChange('packages', updated);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Add-on name"
                                  />
                                  <input
                                    type="number"
                                    value={addOn.price}
                                    onChange={(e) => {
                                      const updated = [...formData.packages!];
                                      updated[pkgIndex].customAddOns![addOnIndex] = { ...addOn, price: parseFloat(e.target.value) || 0 };
                                      handleInputChange('packages', updated);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Price"
                                    min="0"
                                  />
                                  <input
                                    type="text"
                                    value={addOn.description}
                                    onChange={(e) => {
                                      const updated = [...formData.packages!];
                                      updated[pkgIndex].customAddOns![addOnIndex] = { ...addOn, description: e.target.value };
                                      handleInputChange('packages', updated);
                                    }}
                                    className="col-span-2 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Description"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...formData.packages!];
                                    updated[pkgIndex] = {
                                      ...updated[pkgIndex],
                                      customAddOns: updated[pkgIndex].customAddOns?.filter((_, i) => i !== addOnIndex) || []
                                    };
                                    handleInputChange('packages', updated);
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No custom add-ons added</p>
                        )}
                      </div>

                      {/* Custom Rooms */}
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>🛏️</span> Custom Rooms (Package-Exclusive)
                          </h4>
                          <button
                            type="button"
                            onClick={() => openCustomRoomModal(pkgIndex)}
                            className="text-sm px-3 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 transition"
                          >
                            + Add Custom Room
                          </button>
                        </div>
                        {pkg.customRooms && pkg.customRooms.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.customRooms.map((room, roomIndex) => (
                              <div key={room.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                <span className="text-blue-600">🛏️</span>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{room.name}</div>
                                  <div className="text-xs text-gray-500">{room.type} • ₱{room.pricePerNight}/night • {room.units} units</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteCustomRoom(pkgIndex, roomIndex)}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No custom rooms added</p>
                        )}
                      </div>

                      {/* Custom Cottages */}
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>🏠</span> Custom Cottages (Package-Exclusive)
                          </h4>
                          <button
                            type="button"
                            onClick={() => openCustomCottageModal(pkgIndex)}
                            className="text-sm px-3 py-1 bg-green-200 text-green-800 rounded hover:bg-green-300 transition"
                          >
                            + Add Custom Cottage
                          </button>
                        </div>
                        {pkg.customCottages && pkg.customCottages.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.customCottages.map((cottage, cottageIndex) => (
                              <div key={cottage.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                <span className="text-green-600">🏠</span>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{cottage.name}</div>
                                  <div className="text-xs text-gray-500">{cottage.type} • Day: ₱{cottage.dayRate} • Night: ₱{cottage.nightRate} • {cottage.units} units</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteCustomCottage(pkgIndex, cottageIndex)}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No custom cottages added</p>
                        )}
                      </div>

                      {/* Custom Amenities */}
                      <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span>✨</span> Custom Amenities (Package-Exclusive)
                          </h4>
                          <button
                            type="button"
                            onClick={() => openCustomAmenityModal(pkgIndex)}
                            className="text-sm px-3 py-1 bg-purple-200 text-purple-800 rounded hover:bg-purple-300 transition"
                          >
                            + Add Custom Amenity
                          </button>
                        </div>
                        {pkg.customAmenities && pkg.customAmenities.length > 0 ? (
                          <div className="space-y-2">
                            {pkg.customAmenities.map((amenity, amenityIndex) => (
                              <div key={amenity.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                                <span className="text-purple-600">✨</span>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">{amenity.name}</div>
                                  <div className="text-xs text-gray-500">{amenity.type} • Qty: {amenity.quantity} {amenity.price ? `• ₱${amenity.price}` : ''}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteCustomAmenity(pkgIndex, amenityIndex)}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No custom amenities added</p>
                        )}
                      </div>

                      {/* Entrance Fee Integration */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">Entrance Fees</h4>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pkg.includedAdultEntranceFee}
                              onChange={(e) => {
                                const updated = [...formData.packages!];
                                updated[pkgIndex] = { ...updated[pkgIndex], includedAdultEntranceFee: e.target.checked };
                                handleInputChange('packages', updated);
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Include Adult Entrance Fee</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={pkg.includedChildEntranceFee}
                              onChange={(e) => {
                                const updated = [...formData.packages!];
                                updated[pkgIndex] = { ...updated[pkgIndex], includedChildEntranceFee: e.target.checked };
                                handleInputChange('packages', updated);
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm">Include Child Entrance Fee</span>
                          </label>
                        </div>
                      </div>

                      {/* Package Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.packages!];
                            updated[pkgIndex] = { ...updated[pkgIndex], isConfirmed: !updated[pkgIndex].isConfirmed };
                            handleInputChange('packages', updated);
                          }}
                          className={`px-4 py-2 rounded-lg transition ${
                            pkg.isConfirmed
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pkg.isConfirmed ? '✓ Confirmed' : 'Confirm Package'}
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Contact & Policies */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* Contact Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.contact?.phone || ''}
                    onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="+63 XXX XXX XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    value={formData.contact?.email || ''}
                    onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="resort@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Website</label>
                  <input
                    type="url"
                    value={formData.contact?.website || ''}
                    onChange={(e) => handleNestedChange('contact', 'website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="https://yourresort.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Facebook</label>
                  <input
                    type="url"
                    value={formData.contact?.facebook || ''}
                    onChange={(e) => handleNestedChange('contact', 'facebook', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="https://facebook.com/yourresort"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Instagram</label>
                  <input
                    type="url"
                    value={formData.contact?.instagram || ''}
                    onChange={(e) => handleNestedChange('contact', 'instagram', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="https://instagram.com/yourresort"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">TikTok</label>
                  <input
                    type="url"
                    value={formData.contact?.tiktok || ''}
                    onChange={(e) => handleNestedChange('contact', 'tiktok', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="https://tiktok.com/@yourresort"
                  />
                </div>
              </div>
            </div>

            {/* Policies Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Resort Policies</h4>
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const newPolicy = {
                        id: Date.now().toString(),
                        title: "",
                        description: "",
                        isConfirmed: false
                      };
                      const updated = [...(formData.policies?.resortPolicies || []), newPolicy];
                      handleNestedChange('policies', 'resortPolicies', updated);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    + Add Custom Policy
                  </button>
                </div>
                
                {formData.policies?.resortPolicies && formData.policies.resortPolicies.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No custom policies added yet</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto space-y-4 pr-2" style={{maxHeight: '200px'}}>
                    {formData.policies?.resortPolicies?.map((policy, index) => (
                      <div key={policy.id} className="border border-gray-200 rounded-lg bg-white p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span className="font-medium text-gray-800">
                              {policy.title || 'Untitled Policy'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.policies?.resortPolicies?.filter((_, i) => i !== index) || [];
                              handleNestedChange('policies', 'resortPolicies', updated);
                            }}
                            className="text-red-500 hover:text-red-700 transition"
                          >
                            ×
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Policy Title</label>
                            <input
                              type="text"
                              value={policy.title}
                              onChange={(e) => {
                                const updated = [...(formData.policies?.resortPolicies || [])];
                                updated[index] = { ...updated[index], title: e.target.value };
                                handleNestedChange('policies', 'resortPolicies', updated);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                              placeholder="e.g., Pool Rules, Pet Policy, Cancellation Policy"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                            <textarea
                              value={policy.description}
                              onChange={(e) => {
                                const updated = [...(formData.policies?.resortPolicies || [])];
                                updated[index] = { ...updated[index], description: e.target.value };
                                handleNestedChange('policies', 'resortPolicies', updated);
                              }}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm resize-none"
                              placeholder="Describe the policy details..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Module Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Payment Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">GCash Number *</label>
                  <input
                    type="tel"
                    value={formData.gcashNumber || ''}
                    onChange={(e) => handleInputChange('gcashNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="09XX XXX XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Down Payment Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.downPaymentPercentage || 50}
                      onChange={(e) => handleInputChange('downPaymentPercentage', parseFloat(e.target.value) || 50)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      min="0"
                      max="100"
                      required
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Discounts Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Discount Settings</h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">Senior Citizen Discount</span>
                    <input
                      type="checkbox"
                      checked={formData.discounts?.seniorCitizenEnabled || false}
                      onChange={(e) => handleNestedChange('discounts', 'seniorCitizenEnabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  {formData.discounts?.seniorCitizenEnabled && (
                    <div className="relative">
                      <label className="block text-sm font-medium mb-2 text-gray-700">Discount Percentage</label>
                      <input
                        type="number"
                        value={formData.discounts.seniorCitizenPercentage || 20}
                        onChange={(e) => handleNestedChange('discounts', 'seniorCitizenPercentage', parseFloat(e.target.value) || 20)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-9 text-gray-500">%</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">PWD Discount</span>
                    <input
                      type="checkbox"
                      checked={formData.discounts?.pwdEnabled || false}
                      onChange={(e) => handleNestedChange('discounts', 'pwdEnabled', e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  {formData.discounts?.pwdEnabled && (
                    <div className="relative">
                      <label className="block text-sm font-medium mb-2 text-gray-700">Discount Percentage</label>
                      <input
                        type="number"
                        value={formData.discounts.pwdPercentage || 20}
                        onChange={(e) => handleNestedChange('discounts', 'pwdPercentage', parseFloat(e.target.value) || 20)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        min="0"
                        max="100"
                      />
                      <span className="absolute right-3 top-9 text-gray-500">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Images & Review */}
        {currentStep === 6 && (
          <div className="space-y-6">
              {/* Images Section */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">Resort Images</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Upload Images</label>
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                      </p>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG up to 5MB each (Max 6 images total)</p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Upload multiple images of your resort (PNG, JPG, JPEG) - Maximum 6 images
                    <span className="block mt-1 text-xs">
                      Current: {formData.imageUrls?.length || 0} existing + {imagePreviewUrls.length} new = {(formData.imageUrls?.length || 0) + imagePreviewUrls.length}/6 images
                    </span>
                  </p>
                  {(formData.imageUrls?.length || 0) + imagePreviewUrls.length >= 6 && (
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Maximum image limit reached (6/6). Remove existing images to upload new ones.
                      </p>
                    </div>
                  )}
                </div>

                {/* Image Previews Section - New Images */}
                {imagePreviewUrls.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700">New Image Previews</label>
                    <div className="border border-blue-200 rounded-lg bg-blue-50 p-4">
                      <p className="text-xs text-blue-600 mb-3">These images will be uploaded when you save the resort.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviewUrls.map((url, index) => (
                          <div key={`preview-${index}-${url.substring(0, 20)}`} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
                                setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                // Also clear imageFiles from formData if all removed
                                if (imagePreviewUrls.length === 1) {
                                  handleInputChange('imageFiles', undefined);
                                }
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-600"
                            >
                              ×
                            </button>
                            <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              New
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              
              {formData.imageUrls && formData.imageUrls.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Existing Images</label>
                  <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                    <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {filterValidImageUrls(formData.imageUrls || []).map((url, index) => (
                          <div key={index} className="relative group">
                            <SmartImage
                              src={url}
                              alt={`Resort image ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                              fallbackText="Resort Image"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('imageUrls', formData.imageUrls!.filter((_, i) => i !== index));
                              }}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Review Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">Review Your Resort Information</h3>
              
              <div className="space-y-4">
                {/* Basic Info Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Name:</span> {formData.name}</div>
                    <div><span className="font-medium">Location:</span> {formData.barangay}, {formData.purok}, {formData.city}, {formData.country}</div>
                    <div><span className="font-medium">Star Rating:</span> {formData.starRating} Stars</div>
                    <div><span className="font-medium">Type:</span> {formData.type?.join(', ')}</div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Pricing</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {formData.hasDayRate && <div><span className="font-medium">Day Rate:</span> ₱{formData.dayRate}</div>}
                    {formData.hasNightRate && <div><span className="font-medium">Night Rate:</span> ₱{formData.nightRate}</div>}
                    <div><span className="font-medium">Adult Day:</span> ₱{formData.adultEntranceFee?.dayRate}</div>
                    <div><span className="font-medium">Adult Night:</span> ₱{formData.adultEntranceFee?.nightRate}</div>
                  </div>
                  {formData.childEntranceFee && formData.childEntranceFee.length > 0 && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Child Age Groups:</span> {formData.childEntranceFee.length} groups
                    </div>
                  )}
                </div>

                {/* Accommodations Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Accommodations</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Rooms:</span> {formData.rooms?.length || 0}</div>
                    <div><span className="font-medium">Cottages:</span> {formData.cottages?.length || 0}</div>
                  </div>
                </div>

                {/* Amenities & Packages Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Amenities & Packages</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Amenities:</span> {formData.amenities?.length || 0}</div>
                    <div><span className="font-medium">Packages:</span> {formData.packages?.length || 0}</div>
                    <div><span className="font-medium">Facilities:</span> {formData.facilities?.length || 0}</div>
                  </div>
                </div>

                {/* Contact Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Contact & Payment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">Phone:</span> {formData.contact?.phone}</div>
                    <div><span className="font-medium">Email:</span> {formData.contact?.email}</div>
                    <div><span className="font-medium">GCash:</span> {formData.gcashNumber}</div>
                    <div><span className="font-medium">Down Payment:</span> {formData.downPaymentPercentage}%</div>
                  </div>
                </div>

                {/* Discounts Summary */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Discounts</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Senior Citizen:</span>{' '}
                      {formData.discounts?.seniorCitizenEnabled ? `${formData.discounts.seniorCitizenPercentage}%` : 'Disabled'}
                    </div>
                    <div>
                      <span className="font-medium">PWD:</span>{' '}
                      {formData.discounts?.pwdEnabled ? `${formData.discounts.pwdPercentage}%` : 'Disabled'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Ready to submit?</strong> Please review all information above before saving your resort. 
                  You can go back to previous steps to make any changes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Previous
            </button>
          )}
          {currentStep < 6 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition ml-auto"
            >
              Next
            </button>
          ) : (
            <>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-500 transition"
                >
                  Cancel
                </button>
              )}
              <button
                disabled={isLoading}
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-500 transition"
              >
                {isLoading ? "Saving..." : "Save Resort"}
              </button>
            </>
          )}
        </div>
      </form>

      {/* Custom Room Modal */}
      {showCustomRoomModal && tempCustomRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add Custom Room</h3>
            <div className="space-y-4">
              <ImageUpload
                value={tempCustomRoom.imageUrl}
                onChange={(url) => setTempCustomRoom({ ...tempCustomRoom, imageUrl: url })}
                onFileChange={(file) => setTempCustomRoom({ ...tempCustomRoom, imageFile: file })}
                label="Room Image"
              />
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Room Name</label>
                <input
                  type="text"
                  value={tempCustomRoom.name}
                  onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
                <select
                  value={tempCustomRoom.type}
                  onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="Family">Family</option>
                  <option value="Penthouse">Penthouse</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Price/Night</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                    <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                    <input
                      type="number"
                      value={tempCustomRoom.pricePerNight}
                      onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, pricePerNight: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Units</label>
                  <input
                    type="number"
                    value={tempCustomRoom.units}
                    onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, units: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    min="1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Min Occupancy</label>
                  <input
                    type="number"
                    value={tempCustomRoom.minOccupancy}
                    onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, minOccupancy: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Max Occupancy</label>
                  <input
                    type="number"
                    value={tempCustomRoom.maxOccupancy}
                    onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, maxOccupancy: parseInt(e.target.value) || 2 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  value={tempCustomRoom.description}
                  onChange={(e) => setTempCustomRoom({ ...tempCustomRoom, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCustomRoomModal(false);
                  setTempCustomRoom(null);
                  setActivePackageIndex(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomRoom}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cottage Modal */}
      {showCustomCottageModal && tempCustomCottage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add Custom Cottage</h3>
            <div className="space-y-4">
              <ImageUpload
                value={tempCustomCottage.imageUrl}
                onChange={(url) => setTempCustomCottage({ ...tempCustomCottage, imageUrl: url })}
                onFileChange={(file) => setTempCustomCottage({ ...tempCustomCottage, imageFile: file })}
                label="Cottage Image"
              />
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Cottage Name</label>
                <input
                  type="text"
                  value={tempCustomCottage.name}
                  onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
                <select
                  value={tempCustomCottage.type}
                  onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                >
                  <option value="Standard">Standard</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Family">Family</option>
                  <option value="Premium">Premium</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Day Rate</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition">
                    <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                    <input
                      type="number"
                      value={tempCustomCottage.dayRate}
                      onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, dayRate: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Night Rate</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500 transition">
                    <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                    <input
                      type="number"
                      value={tempCustomCottage.nightRate}
                      onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, nightRate: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Units</label>
                  <input
                    type="number"
                    value={tempCustomCottage.units}
                    onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, units: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">Max Occupancy</label>
                  <input
                    type="number"
                    value={tempCustomCottage.maxOccupancy}
                    onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, maxOccupancy: parseInt(e.target.value) || 4 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  value={tempCustomCottage.description}
                  onChange={(e) => setTempCustomCottage({ ...tempCustomCottage, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCustomCottageModal(false);
                  setTempCustomCottage(null);
                  setActivePackageIndex(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomCottage}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Save Cottage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Amenity Modal */}
      {showCustomAmenityModal && tempCustomAmenity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Add Custom Amenity</h3>
            <div className="space-y-4">
              <ImageUpload
                value={tempCustomAmenity.imageUrl}
                onChange={(url) => setTempCustomAmenity({ ...tempCustomAmenity, imageUrl: url })}
                onFileChange={(file) => setTempCustomAmenity({ ...tempCustomAmenity, imageFile: file })}
                label="Amenity Image"
              />
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Amenity Name</label>
                <input
                  type="text"
                  value={tempCustomAmenity.name}
                  onChange={(e) => setTempCustomAmenity({ ...tempCustomAmenity, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Type</label>
                <select
                  value={tempCustomAmenity.type}
                  onChange={(e) => setTempCustomAmenity({ ...tempCustomAmenity, type: e.target.value as 'included' | 'addon' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="included">Included in Package</option>
                  <option value="addon">Add-on (Extra Cost)</option>
                </select>
              </div>
              {tempCustomAmenity.type === 'addon' && (
                <div className="relative">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Price</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition">
                    <span className="px-4 py-3 bg-gray-50 text-gray-500 border-r border-gray-300 font-medium">₱</span>
                    <input
                      type="number"
                      value={tempCustomAmenity.price}
                      onChange={(e) => setTempCustomAmenity({ ...tempCustomAmenity, price: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-4 py-3 border-0 focus:outline-none focus:ring-0"
                      min="0"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={tempCustomAmenity.quantity}
                  onChange={(e) => setTempCustomAmenity({ ...tempCustomAmenity, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <textarea
                  value={tempCustomAmenity.description}
                  onChange={(e) => setTempCustomAmenity({ ...tempCustomAmenity, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCustomAmenityModal(false);
                  setTempCustomAmenity(null);
                  setActivePackageIndex(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomAmenity}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Save Amenity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageHotelForm;
