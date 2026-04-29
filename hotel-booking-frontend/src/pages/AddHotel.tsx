import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import ManageHotelForm from "../../../shared/forms/ManageHotelForm/ManageHotelForm";
import { HotelFormData } from "../../../shared/types/HotelFormData";
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";

const AddHotel = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation(apiClient.addMyHotel, {
    onSuccess: () => {
      // Clear the draft after successful submission
      localStorage.removeItem('hotelFormDraft-add-new');
      showToast({
        title: "Beach Resort Added Successfully",
        description:
          "Your beach resort has been added to the platform successfully! Redirecting to My Resorts...",
        type: "SUCCESS",
      });
      // Redirect to My Hotels page after successful save
      setTimeout(() => {
        navigate("/my-hotels");
      }, 1500); // Give user time to see the success message
    },
    onError: (error: any) => {
      console.error("Error adding hotel:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      
      let errorMessage = "";
      let errorTitle = "Failed to Add Resort";
      
      // Network/Connection errors
      if (!error.response) {
        if (error.code === 'ECONNABORTED') {
          errorTitle = "Request Timeout";
          errorMessage = "The request took too long to complete. Please check your internet connection and try again.";
        } else if (error.message === 'Network Error') {
          errorTitle = "Network Connection Error";
          errorMessage = "Unable to connect to the server. Please check your internet connection and try again.";
        } else {
          errorTitle = "Connection Error";
          errorMessage = "Unable to add resort. Please check your internet connection and try again.";
        }
      }
      // HTTP Status Code specific errors
      else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorTitle = "Invalid Data";
            if (data.message) {
              errorMessage = `Validation error: ${data.message}`;
            } else if (data.errors && Array.isArray(data.errors)) {
              errorMessage = `Please fix the following issues: ${data.errors.map((e: any) => e.message).join(", ")}`;
            } else {
              errorMessage = "Please check all required fields and try again.";
            }
            break;
            
          case 401:
            errorTitle = "Authentication Error";
            errorMessage = "Your session has expired. Please log in again and retry.";
            break;
            
          case 403:
            errorTitle = "Permission Denied";
            errorMessage = "You don't have permission to add resorts. Please contact your administrator.";
            break;
            
          case 409:
            errorTitle = "Duplicate Resort";
            errorMessage = "A resort with this name or location already exists. Please check your details and try again.";
            break;
            
          case 413:
            errorTitle = "File Too Large";
            errorMessage = "One or more images are too large. Please compress images and try again.";
            break;
            
          case 422:
            errorTitle = "Validation Error";
            if (data.message) {
              errorMessage = data.message;
            } else if (data.errors && Array.isArray(data.errors)) {
              errorMessage = data.errors.map((e: any) => e.message).join(", ");
            } else {
              errorMessage = "Please check all fields for correct formatting and required information.";
            }
            break;
            
          case 429:
            errorTitle = "Too Many Requests";
            errorMessage = "Please wait a moment before trying again.";
            break;
            
          case 500:
            errorTitle = "Server Error";
            errorMessage = "Our server encountered an error. Please try again in a few minutes.";
            break;
            
          case 502:
          case 503:
          case 504:
            errorTitle = "Service Unavailable";
            errorMessage = "Our servers are temporarily unavailable. Please try again in a few minutes.";
            break;
            
          default:
            errorTitle = "Add Failed";
            if (data.message) {
              errorMessage = data.message;
            } else {
              errorMessage = `An unexpected error occurred (${status}). Please try again or contact support if the problem persists.`;
            }
        }
      }
      
      // Fallback if no specific error message was set
      if (!errorMessage) {
        errorMessage = "Unable to add resort. Please try again or contact support if the problem persists.";
      }
      
      showToast({
        title: errorTitle,
        description: errorMessage,
        type: "ERROR",
      });
    },
  });

  const handleSave = (hotelFormData: HotelFormData) => {
    console.log('=== ADD HOTEL FORM DATA ===');
    console.log('Form data being sent:', JSON.stringify(hotelFormData, null, 2));

    mutate(hotelFormData);
  };

  return (
    <ManageHotelForm 
      onSubmit={handleSave} 
      onCancel={() => navigate("/my-hotels")}
      isLoading={isLoading}
    />
  );  
};

export default AddHotel;
