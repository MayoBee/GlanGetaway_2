import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMyHotelById, updateMyHotelById } from "../api-client";
import ManageHotelForm from "../forms/ManageHotelForm/ManageHotelForm";
import useAppContext from "../hooks/useAppContext";

const EditHotel = () => {
  const { hotelId } = useParams();
  const { showToast } = useAppContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  console.log("EditHotel - hotelId:", hotelId);
  console.log("EditHotel - current URL:", window.location.href);

  const { data: hotel } = useQuery(
    "fetchMyHotelById",
    () => fetchMyHotelById(hotelId || ""),
    {
      enabled: !!hotelId,
    }
  );

  const { mutate, isLoading } = useMutation(updateMyHotelById, {
    onSuccess: () => {
      // Invalidate hotel queries to ensure fresh data
      queryClient.invalidateQueries("fetchMyHotelById");
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === "fetchHotelById" });

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
    }
  });

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

  const handleSave = (hotelFormData: any) => {
    // Log data being sent for debugging
    console.log("=== EDIT HOTEL REQUEST DATA ===");
    console.log("Hotel ID:", hotelId);

    let formData: FormData;

    // Check if we received FormData (has new image files) or JSON
    if (hotelFormData instanceof FormData) {
      console.log("Received FormData with image files");
      formData = hotelFormData;
    } else {
      // Received JSON data (no new images) - convert to FormData
      // since updateMyHotelById expects FormData
      console.log("Received JSON data, converting to FormData");
      formData = new FormData();

      // Helper to properly append accommodation arrays to FormData
      const appendAccommodationArray = (accommodations: any[], arrayName: string) => {
        if (!Array.isArray(accommodations)) return;
        
        accommodations.forEach((item, index) => {
          // Ensure all required fields are present
          const accommodationItem = {
            id: item.id || '',
            name: item.name || '',
            type: item.type || '',
            description: item.description || '',
            imageUrl: item.imageUrl || '',
            units: item.units || 1, // Ensure units field is preserved
            ...item
          };

          // Append each field individually to match backend parsing expectations
          Object.entries(accommodationItem).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              const fieldName = `${arrayName}[${index}][${key}]`;
              
              // Handle nested objects like includedEntranceFee
              if (typeof value === 'object' && !Array.isArray(value)) {
                Object.entries(value).forEach(([subKey, subValue]) => {
                  if (subValue !== undefined && subValue !== null) {
                    formData.append(`${fieldName}[${subKey}]`, String(subValue));
                  }
                });
              } else if (Array.isArray(value)) {
                // Handle arrays like amenities
                value.forEach((arrayItem, arrayIndex) => {
                  formData.append(`${fieldName}[${arrayIndex}]`, String(arrayItem));
                });
              } else {
                formData.append(fieldName, String(value));
              }
            }
          });
        });
      };

      // Helper to recursively append other objects/arrays to FormData
      const appendToFormData = (obj: any, prefix = '') => {
        if (obj === null || obj === undefined) return;

        // Special handling for accommodation arrays
        if (prefix === 'rooms') {
          appendAccommodationArray(obj, 'rooms');
          return;
        }
        if (prefix === 'cottages') {
          appendAccommodationArray(obj, 'cottages');
          return;
        }
        if (prefix === 'amenities') {
          appendAccommodationArray(obj, 'amenities');
          return;
        }
        if (prefix === 'packages') {
          appendAccommodationArray(obj, 'packages');
          return;
        }

        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              Object.entries(item).forEach(([key, value]) => {
                appendToFormData(value, `${prefix}[${index}][${key}]`);
              });
            } else {
              formData.append(`${prefix}[${index}]`, String(item));
            }
          });
        } else if (typeof obj === 'object') {
          Object.entries(obj).forEach(([key, value]) => {
            const newPrefix = prefix ? `${prefix}[${key}]` : key;
            appendToFormData(value, newPrefix);
          });
        } else {
          formData.append(prefix, String(obj));
        }
      };

      // Debug log the accommodation data before conversion
      console.log("=== ACCOMMODATION DATA BEFORE CONVERSION ===");
      console.log("Rooms:", hotelFormData.rooms);
      console.log("Cottages:", hotelFormData.cottages);
      console.log("Amenities:", hotelFormData.amenities);
      console.log("Packages:", hotelFormData.packages);

      appendToFormData(hotelFormData);
    }

    // Ensure hotelId is set in FormData
    formData.append('hotelId', hotelId || '');
    formData.append('_id', hotelId || '');

    console.log("FormData keys:", Array.from(formData.keys()));
    console.log("FormData has imageFiles:", formData.has('imageFiles'));

    // Debug FormData accommodation fields
    console.log("=== FORMDATA ACCOMMODATION FIELDS DEBUG ===");
    for (let [key, value] of formData.entries()) {
      if (key.includes('rooms[') || key.includes('cottages[') || key.includes('amenities[') || key.includes('packages[')) {
        console.log(`${key}:`, value);
      }
    }

    mutate(formData);
  };

  return (
    <ManageHotelForm hotel={hotel} onSave={handleSave} isLoading={isLoading} />
  );
};

export default EditHotel;

