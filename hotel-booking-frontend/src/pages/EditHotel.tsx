import { useMutation, useQuery } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import ManageHotelForm from "../../../shared/forms/ManageHotelForm/ManageHotelForm";
import { HotelFormData } from "../../../shared/types/HotelFormData";
import useAppContext from "../hooks/useAppContext";

const EditHotel = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  console.log("EditHotel - hotelId:", hotelId);

  if (!hotelId) {
    console.error("No hotelId found in URL params");
    showToast({
      title: "Error",
      description: "No resort ID found. Please navigate from My Resorts page.",
      type: "ERROR",
    });
    navigate("/my-hotels");
    return null;
  }

  const { data: hotel } = useQuery(
    "fetchMyHotelById",
    () => apiClient.fetchMyHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
    }
  );

  const { mutate, isLoading } = useMutation(apiClient.updateMyHotelById, {
    onSuccess: () => {
      // Clear the draft after successful submission
      localStorage.removeItem(`hotelFormDraft-edit-${hotelId}`);
      showToast({
        title: "Resort Updated Successfully",
        description: "Your resort details have been updated successfully! Redirecting to My Resorts...",
        type: "SUCCESS",
      });
      setTimeout(() => {
        navigate("/my-hotels");
      }, 1500);
    },
    onError: (error: any) => {
      console.error("Edit hotel error:", error);
      let errorMessage = "Failed to update resort. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast({
        title: "Update Failed",
        description: errorMessage,
        type: "ERROR",
      });
    },
  });

  const handleSave = (hotelFormData: HotelFormData) => {
    console.log("=== EDIT HOTEL REQUEST DATA ===");
    console.log("Hotel ID:", hotelId);
    console.log("Form Data:", JSON.stringify(hotelFormData, null, 2));
    
    // Create FormData for the comprehensive hotel data
    const formData = new FormData();
    
    // Add hotel ID first
    if (hotelId) {
      formData.append('hotelId', hotelId);
    }
    
    // Add all form fields to FormData
    Object.keys(hotelFormData).forEach(key => {
      const value = hotelFormData[key as keyof HotelFormData];
      if (key === 'imageUrls' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'type' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'facilities' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'amenities' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'rooms' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'cottages' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'packages' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'contact' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'policies' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'discounts' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'adultEntranceFee' && typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else if (key === 'childEntranceFee' && Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'number') {
        formData.append(key, value.toString());
      } else if (typeof value === 'boolean') {
        formData.append(key, value.toString());
      } else if (typeof value === 'string' && value) {
        formData.append(key, value);
      }
    });
    
    mutate(formData);
  };

  return (
    <ManageHotelForm 
      hotel={hotel} 
      onSubmit={handleSave} 
      onCancel={() => navigate("/my-hotels")}
      isLoading={isLoading}
    />
  );
};

export default EditHotel;
