import { useMutation, useQuery } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMyHotelById, updateMyHotelById } from "../api-client";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import useAppContext from "../hooks/useAppContext";

const EditHotel = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();

  console.log("EditHotel - hotelId:", hotelId);
  console.log("EditHotel - current URL:", window.location.href);

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
    () => fetchMyHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
    }
  );

  const { mutate, isLoading } = useMutation(updateMyHotelById, {
    onSuccess: () => {
      showToast({
        title: "Resort Updated Successfully",
        description:
          "Your resort details have been updated successfully! Redirecting to My Resorts...",
        type: "SUCCESS",
      });
      // Redirect to My Hotels page after successful update
      setTimeout(() => {
        navigate("/my-hotels");
      }, 1500); // Give user time to see the success message
    },
    onError: (error: any) => {
      console.error("=== EDIT HOTEL ERROR DETAILS ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error code:", error.code);
      console.error("Error config:", error.config);
      console.error("Error response status:", error.response?.status);
      console.error("Error response status text:", error.response?.statusText);
      console.error("Error response headers:", error.response?.headers);
      console.error("Error response data:", error.response?.data);
      
      // Log the request that caused the error
      if (error.config) {
        console.log("=== REQUEST DETAILS ===");
        console.log("URL:", error.config.url);
        console.log("Method:", error.config.method);
        console.log("Headers:", error.config.headers);
        console.log("Data:", error.config.data);
      }
      
      let errorMessage = "";
      let errorTitle = "Failed to Update Resort";
      
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
          errorMessage = "Unable to update resort. Please check your internet connection and try again.";
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
            errorMessage = "You don't have permission to update this resort.";
            break;
            
          case 404:
            errorTitle = "Resort Not Found";
            errorMessage = "The resort you're trying to update doesn't exist or has been deleted.";
            break;
            
          case 409:
            errorTitle = "Conflict Error";
            errorMessage = "This resort has been modified by another user. Please refresh and try again.";
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
            errorTitle = "Update Failed";
            if (data.message) {
              errorMessage = data.message;
            } else {
              errorMessage = `An unexpected error occurred (${status}). Please try again or contact support if the problem persists.`;
            }
        }
      }
      
      // Fallback if no specific error message was set
      if (!errorMessage) {
        errorMessage = "Unable to update resort. Please try again or contact support if the problem persists.";
      }
      
      showToast({
        title: errorTitle,
        description: errorMessage,
        type: "ERROR",
      });
    },
  });

  const handleSave = (hotelFormData: any) => {
    // Log data being sent for debugging
    console.log("=== EDIT HOTEL REQUEST DATA ===");
    console.log("Hotel ID:", hotelId);
    console.log("Form Data:", JSON.stringify(hotelFormData, null, 2));
    console.log("Form Data Keys:", Object.keys(hotelFormData));
    
    // Check for potential issues
    const imgFiles = hotelFormData.imageFiles as unknown as FileList | File[];
    if (imgFiles && (imgFiles instanceof FileList || Array.isArray(imgFiles))) {
      const fileCount = imgFiles instanceof FileList ? imgFiles.length : imgFiles.length;
      if (fileCount > 0) {
        console.log("Image Files:", fileCount, "files");
        Array.from(imgFiles).forEach((file: File, index: number) => {
          console.log(`File ${index}:`, file.name, file.size, file.type);
        });
      }
    }
    
    // Create FormData for file upload support
    const formData = new FormData();
    
    // Add hotel ID first - ensure it's a string and not null/undefined
    if (hotelId) {
      formData.append('hotelId', hotelId);
      console.log("=== HOTEL ID ADDED TO FORM DATA ===");
      console.log("Hotel ID value:", hotelId);
      console.log("FormData hotelId:", formData.get('hotelId'));
    } else {
      console.error("=== HOTEL ID IS NULL OR UNDEFINED ===");
      showToast({
        title: "Error",
        description: "Hotel ID is missing. Cannot update resort.",
        type: "ERROR",
      });
      return;
    }
    
    // Add room files for upload
    if (hotelFormData.rooms && Array.isArray(hotelFormData.rooms)) {
      hotelFormData.rooms.forEach((room: any, roomIndex: number) => {
        // Check if room has image file data (data URL indicates a new image was selected)
        if (room.imageUrl && room.imageUrl.startsWith('data:')) {
          // Convert data URL to File object
          const dataUrl = room.imageUrl;
          const base64Data = dataUrl.split(',')[1];
          const mimeType = dataUrl.split(':')[1].split(';')[0];
          
          try {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File([blob], `room_${roomIndex}_${Date.now()}.jpg`, { type: mimeType });
            
            formData.append('roomFiles', file);
            console.log(`Added room file for room ${roomIndex}:`, file.name);
          } catch (error) {
            console.error(`Error converting room ${roomIndex} image to file:`, error);
          }
        }
      });
    }
    
    // Add cottage files for upload
    if (hotelFormData.cottages && Array.isArray(hotelFormData.cottages)) {
      hotelFormData.cottages.forEach((cottage: any, cottageIndex: number) => {
        if (cottage.imageUrl && cottage.imageUrl.startsWith('data:')) {
          const dataUrl = cottage.imageUrl;
          const base64Data = dataUrl.split(',')[1];
          const mimeType = dataUrl.split(':')[1].split(';')[0];
          
          try {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File([blob], `cottage_${cottageIndex}_${Date.now()}.jpg`, { type: mimeType });
            
            formData.append('cottageFiles', file);
            console.log(`Added cottage file for cottage ${cottageIndex}:`, file.name);
          } catch (error) {
            console.error(`Error converting cottage ${cottageIndex} image to file:`, error);
          }
        }
      });
    }
    
    // Add amenity files for upload
    if (hotelFormData.amenities && Array.isArray(hotelFormData.amenities)) {
      hotelFormData.amenities.forEach((amenity: any, amenityIndex: number) => {
        if (amenity.imageUrl && amenity.imageUrl.startsWith('data:')) {
          const dataUrl = amenity.imageUrl;
          const base64Data = dataUrl.split(',')[1];
          const mimeType = dataUrl.split(':')[1].split(';')[0];
          
          try {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const file = new File([blob], `amenity_${amenityIndex}_${Date.now()}.jpg`, { type: mimeType });
            
            formData.append('amenityFiles', file);
            console.log(`Added amenity file for amenity ${amenityIndex}:`, file.name);
          } catch (error) {
            console.error(`Error converting amenity ${amenityIndex} image to file:`, error);
          }
        }
      });
    }
    
    // Debug file detection
    console.log("=== FILE DETECTION DEBUG ===");
    const roomImageCount = hotelFormData.rooms?.filter((room: any) => room.imageUrl && room.imageUrl.startsWith('data:')).length || 0;
    const cottageImageCount = hotelFormData.cottages?.filter((cottage: any) => cottage.imageUrl && cottage.imageUrl.startsWith('data:')).length || 0;
    const amenityImageCount = hotelFormData.amenities?.filter((amenity: any) => amenity.imageUrl && amenity.imageUrl.startsWith('data:')).length || 0;
    
    console.log(`Rooms with new images: ${roomImageCount}`);
    console.log(`Cottages with new images: ${cottageImageCount}`);
    console.log(`Amenities with new images: ${amenityImageCount}`);
    
    // Add all form fields to FormData
    console.log("=== FORM DATA ITERATION DEBUG ===");
    console.log("hotelFormData keys:", Object.keys(hotelFormData));
    
    Object.keys(hotelFormData).forEach(key => {
      const value = hotelFormData[key];
      console.log("Processing key: " + key + ", value type: " + typeof value + ", is policies: " + (key === 'policies'));
      if (key === 'imageFiles') {
        // Handle files separately - check for FileList or Array
        if (value) {
          console.log("=== IMAGE FILES DEBUG ===");
          console.log("imageFiles value type:", typeof value);
          console.log("imageFiles value:", value);
          
          let files: File[] = [];
          
          if (value instanceof FileList) {
            console.log("Processing FileList with", value.length, "files");
            files = Array.from(value);
          } else if (Array.isArray(value)) {
            console.log("Processing Array with", value.length, "files");
            files = value;
          } else if (value && typeof value === 'object' && value[0]) {
            console.log("Processing object with numeric keys");
            // Handle DataTransfer files object
            files = Object.values(value).filter((item: any) => item instanceof File) as File[];
          }
          
          console.log("Final files array:", files.length, "files");
          files.forEach((file: File, index: number) => {
            console.log(`Appending file ${index}:`, file.name, file.size, file.type);
            formData.append('imageFiles', file);
          });
        }
      } else if (key === 'rooms' || key === 'cottages' || key === 'amenities') {
        // Handle nested objects with images
        if (Array.isArray(value)) {
          value.forEach((item: any, itemIndex: number) => {
            Object.keys(item).forEach(itemKey => {
              const itemValue = item[itemKey];
              if (itemKey === 'imageUrl' && itemValue && itemValue.startsWith('data:')) {
                // Convert data URL to file if needed
                // For now, just add data URL as string
                formData.append(`${key}[${itemIndex}][${itemKey}]`, itemValue);
              } else if (Array.isArray(itemValue)) {
                // Handle nested arrays (like amenities)
                itemValue.forEach((arrayItem: any, arrayIndex: number) => {
                  formData.append(`${key}[${itemIndex}][${itemKey}][${arrayIndex}]`, arrayItem);
                });
              } else {
                formData.append(`${key}[${itemIndex}][${itemKey}]`, itemValue);
              }
            });
          });
        }
      } else if (key === 'policies' && typeof value === 'object') {
        console.log("=== POLICIES HANDLING ===");
        console.log("Policies value:", value);
        // Handle policies object by appending individual fields
        Object.keys(value).forEach(policyKey => {
          const policyValue = (value as any)[policyKey];
          console.log("Processing policyKey:", policyKey, ", is resortPolicies:", policyKey === 'resortPolicies');
          if (policyKey === 'resortPolicies' && Array.isArray(policyValue)) {
            console.log("Found resortPolicies array:", policyValue);
            // Handle resort policies array - send both individual fields AND JSON string
            policyValue.forEach((policy, policyIndex) => {
              console.log("Processing policy index:", policyIndex, "policy:", policy);
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
        // Handle other arrays properly
        value.forEach((item: any) => {
          if (typeof item === 'object') {
            // For object arrays, stringify to avoid character-by-character issues
            formData.append(key, JSON.stringify(item));
          } else {
            formData.append(key, item);
          }
        });
      } else if (key === 'contact' && typeof value === 'object') {
        // Handle contact object by appending individual fields
        Object.keys(value).forEach(contactKey => {
          const contactValue = (value as any)[contactKey];
          if (contactValue !== undefined && contactValue !== null) {
            formData.append(`contact.${contactKey}`, contactValue);
          }
        });
      } else if (typeof value === 'object' && key !== 'policies') {
        // Handle other object fields by stringifying (excluding policies which is handled above)
        formData.append(key, JSON.stringify(value));
      } else {
        // Handle simple fields
        formData.append(key, value);
      }
    });
    
    // Debug FormData contents
    console.log("=== FORM DATA CONTENTS BEFORE API CALL ===");
    console.log("FormData hotelId:", formData.get('hotelId'));
    console.log("FormData contact.phone:", formData.get('contact.phone'));
    console.log("FormData contact.email:", formData.get('contact.email'));
    console.log("FormData policies.checkInTime:", formData.get('policies.checkInTime'));
    console.log("FormData policies.dayCheckInTime:", formData.get('policies.dayCheckInTime'));
    
    // Debug resort policies being added to FormData
    console.log("=== RESORT POLICIES BEING ADDED TO FORM DATA ===");
    if (hotelFormData.policies && hotelFormData.policies.resortPolicies) {
      console.log("Original resortPolicies from form:", hotelFormData.policies.resortPolicies);
      hotelFormData.policies.resortPolicies.forEach((policy: any, index: number) => {
        console.log(`Policy ${index} from form:`, policy);
      });
    } else {
      console.log("No resortPolicies found in form data");
    }
    
    // Debug resort policies
    let policyIndex = 0;
    while (formData.get(`policies.resortPolicies[${policyIndex}][id]`)) {
      console.log(`Policy ${policyIndex} in FormData:`, {
        id: formData.get(`policies.resortPolicies[${policyIndex}][id]`),
        title: formData.get(`policies.resortPolicies[${policyIndex}][title]`),
        description: formData.get(`policies.resortPolicies[${policyIndex}][description]`)
      });
      policyIndex++;
    }
    
    console.log("FormData entries count:", Array.from(formData.entries()).length);
    
    // Log all FormData entries for debugging
    console.log("=== ALL FORM DATA ENTRIES ===");
    for (let [key, value] of formData.entries()) {
      if (key.startsWith('policies.resortPolicies')) {
        console.log(`${key}:`, value);
      }
    }
    
    // Don't add hotelId to data - it comes from URL parameter
    console.log("=== ABOUT TO CALL MUTATE ===");
    console.log("FormData being sent:", Array.from(formData.entries()));
    mutate(formData);
  };

  return (
    <ManageHotelForm hotel={hotel} onSave={handleSave} isLoading={isLoading} />
  );
};

export default EditHotel;
