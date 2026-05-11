import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import ManageHotelForm, { HotelFormData } from "../../../shared/forms/ManageHotelForm/ManageHotelForm";
import useAppContext from "../hooks/useAppContext";
import * as apiClient from "../api-client";

const AddHotel = () => {
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation(apiClient.addMyHotel, {
    onSuccess: () => {
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
    console.log('Rooms units:', hotelFormData.rooms?.map(r => ({ name: r.name, units: r.units })));
    console.log('Cottages units:', hotelFormData.cottages?.map(c => ({ name: c.name, units: c.units })));
    console.log('Amenities units:', hotelFormData.amenities?.map(a => ({ name: a.name, units: a.units })));
    
    // Create FormData for file upload support
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(hotelFormData).forEach(key => {
      const value = hotelFormData[key];
      if (key === 'imageFiles') {
        // Handle files separately
        if (value && Array.isArray(value)) {
          Array.from(value).forEach((file: File, index: number) => {
            formData.append('imageFiles', file);
          });
        }
      } else if (key === 'rooms' || key === 'cottages' || key === 'amenities') {
        // Handle nested objects with images
        if (Array.isArray(value)) {
          value.forEach((item: any, itemIndex: number) => {
            Object.keys(item).forEach(itemKey => {
              if (itemKey === 'imageUrl' && item.imageUrl && item.imageUrl.startsWith('data:')) {
                // Convert data URL to file if needed
                // For now, just add the data URL as string
                formData.append(`${key}[${itemIndex}][${itemKey}]`, item.imageUrl);
              } else {
                formData.append(`${key}[${itemIndex}][${itemKey}]`, item[itemKey]);
              }
            });
          });
        }
      } else if (key === 'policies' && typeof value === 'object') {
        // Handle policies object by appending individual fields
        Object.keys(value).forEach(policyKey => {
          const policyValue = (value as any)[policyKey];
          if (policyKey === 'resortPolicies' && Array.isArray(policyValue)) {
            // Handle resort policies array - send both individual fields AND JSON string
            policyValue.forEach((policy, policyIndex) => {
              Object.keys(policy).forEach(policyField => {
                const fieldValue = policy[policyField];
                if (fieldValue !== undefined && fieldValue !== null) {
                  formData.append(`policies.resortPolicies[${policyIndex}][${policyField}]`, String(fieldValue));
                }
              });
            });
          } else if (policyValue !== undefined && policyValue !== null) {
            formData.append(`policies.${policyKey}`, policyValue);
          }
        });
      } else if (Array.isArray(value)) {
        // Handle other arrays
        value.forEach((item: any, index: number) => {
          Object.keys(item).forEach(itemKey => {
            formData.append(`${key}[${index}][${itemKey}]`, item[itemKey]);
          });
        });
      } else {
        // Handle simple fields
        formData.append(key, value);
      }
    });
    
    mutate(formData);
  };

  return <ManageHotelForm onSave={handleSave} isLoading={isLoading} />;  
};

export default AddHotel;
