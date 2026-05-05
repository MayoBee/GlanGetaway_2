import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import ManageHotelForm, { HotelFormData } from "../forms/ManageHotelForm/ManageHotelForm";
import useAppContext from "../hooks/useAppContext";
import { addMyHotel } from "../api-client";
import { HotelFormData as ApiHotelFormData } from "../shared/types";

const AddHotel = () => {
  const { showToast, user, isLoggedIn } = useAppContext();
  const navigate = useNavigate();

  const { mutate, isLoading } = useMutation(addMyHotel, {
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
            errorMessage = "Your session has expired. Redirecting to login page...";
            // Save current form data to localStorage before redirecting
            const currentFormData = (window as any).currentHotelFormData;
            if (currentFormData) {
              localStorage.setItem('pendingHotelFormData', JSON.stringify(currentFormData));
              localStorage.setItem('pendingHotelFormTimestamp', Date.now().toString());
              showToast({
                title: "Session Expired",
                description: "Your form data has been saved. Please log in again to continue adding your resort.",
                type: "INFO",
              });
            }
            // Redirect to login after a short delay
            setTimeout(() => {
              navigate('/signin', { 
                state: { 
                  message: "Your session expired. Please log in again to continue adding your resort.",
                  returnUrl: '/add-hotel'
                } 
              });
            }, 2000);
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
    
    // Check if user is authenticated before attempting to save
    if (!isLoggedIn || !user) {
      showToast({
        title: "Authentication Required",
        description: "Please log in to add a resort. Your form data will be saved.",
        type: "ERROR",
      });
      
      // Save form data before redirecting to login
      localStorage.setItem('pendingHotelFormData', JSON.stringify(hotelFormData));
      localStorage.setItem('pendingHotelFormTimestamp', Date.now().toString());
      
      // Redirect to login page
      setTimeout(() => {
        navigate('/signin', { 
          state: { 
            message: "Please log in to add a resort. Your form data has been saved.",
            returnUrl: '/add-hotel'
          } 
        });
      }, 1500);
      return;
    }
    
    // Add missing required fields for API
    const apiFormData: ApiHotelFormData = {
      ...hotelFormData,
      userId: user?._id || "", // Use actual user ID from auth context
      lastUpdated: new Date()
    };
    
    // Pass the complete HotelFormData to addMyHotel function
    // The addMyHotel function in api-client.ts will handle FormData conversion
    mutate(apiFormData);
  };

  return <ManageHotelForm onSave={handleSave} isLoading={isLoading} />;  
};

export default AddHotel;

