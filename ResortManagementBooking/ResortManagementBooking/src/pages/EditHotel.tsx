import { useMutation, useQuery, useQueryClient } from "react-query";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMyHotelById, updateMyHotelByIdJson } from "../api-client";
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

  const { mutate, isLoading } = useMutation(updateMyHotelByIdJson, {
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
    console.log("Form Data:", JSON.stringify(hotelFormData, null, 2));
    console.log("Form Data Keys:", Object.keys(hotelFormData));
    
    // Add hotel ID to the data for JSON API
    const dataToSend = {
      ...hotelFormData,
      _id: hotelId, // Required for JSON API
      hotelId: hotelId // Also include hotelId for compatibility
    };
    
    console.log("=== FINAL DATA BEING SENT TO JSON API ===");
    console.log("Data with hotelId:", JSON.stringify(dataToSend, null, 2));
    
    // Send pure JSON data instead of FormData
    mutate(dataToSend);
  };

  return (
    <ManageHotelForm hotel={hotel} onSave={handleSave} isLoading={isLoading} />
  );
};

export default EditHotel;

