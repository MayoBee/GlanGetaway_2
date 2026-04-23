import React, { useState, useEffect } from "react";
import axios from "axios";
import { axiosInstance, getApiBaseUrl } from '@glan-getaway/shared-auth';

interface AmenitySlotBookingProps {
  amenityId: string;
  hotelId: string;
  amenityName: string;
  bookingId?: string;
  onSlotBooked?: (slot: any) => void;
}

interface TimeSlot {
  _id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  availableSlots: number;
  currentPrice: number;
  basePrice: number;
  priceMultiplier: number;
  isWeatherLocked: boolean;
  weatherLockReason?: string;
  status: string;
}

export const AmenitySlotBooking: React.FC<AmenitySlotBookingProps> = ({
  amenityId,
  hotelId,
  amenityName,
  bookingId,
  onSlotBooked,
}) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherLocked, setWeatherLocked] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [amenityId, selectedDate]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/api/amenity-slots/${amenityId}`,
        { params: { date: selectedDate } }
      );
      setSlots(response.data);

      // Check if any slots are weather locked
      const hasWeatherLock = response.data.some(
        (slot: TimeSlot) => slot.isWeatherLocked
      );
      setWeatherLocked(hasWeatherLock);
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("session_id");
      const response = await axios.post(
        `${getApiBaseUrl()}/api/amenity-slots/${selectedSlot._id}/book`,
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSlotBooked?.(response.data);
      setSelectedSlot(null);
      fetchSlots(); // Refresh slots
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to book slot");
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = (slot: TimeSlot) => {
    if (slot.priceMultiplier > 1) {
      return (
        <span>
          <span className="text-gray-400 line-through text-sm">
            PHP {slot.basePrice}
          </span>{" "}
          <span className="font-bold text-orange-600">
            PHP {slot.currentPrice}
          </span>
        </span>
      );
    }
    return <span className="font-bold">PHP {slot.currentPrice}</span>;
  };

  // Generate dates for the next 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split("T")[0];
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-bold text-gray-800 mb-3">
        🚤 Book {amenityName}
      </h3>

      {/* Weather Lock Warning */}
      {weatherLocked && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
          <p className="text-amber-800 text-sm">
            ⚠️ Some time slots may be unavailable due to current weather
            conditions. Please check below.
          </p>
        </div>
      )}

      {/* Date Selection */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium ${
              selectedDate === date
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {new Date(date).toLocaleDateString("en-PH", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      )}

      {/* Time Slots Grid */}
      {!loading && (
        <div className="grid grid-cols-2 gap-2">
          {slots.map((slot) => (
            <button
              key={slot._id}
              onClick={() => !slot.isWeatherLocked && slot.availableSlots > 0 && setSelectedSlot(slot)}
              disabled={
                slot.isWeatherLocked || slot.availableSlots === 0 || slot.status === "full"
              }
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                slot.isWeatherLocked
                  ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed"
                  : slot.availableSlots === 0 || slot.status === "full"
                  ? "bg-red-50 border-red-200 opacity-50 cursor-not-allowed"
                  : selectedSlot?._id === slot._id
                  ? "bg-blue-50 border-blue-500"
                  : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-gray-800">
                  {slot.startTime} - {slot.endTime}
                </span>
                {slot.isWeatherLocked && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">
                    🔒
                  </span>
                )}
              </div>

              <div className="text-sm">{getPriceDisplay(slot)}</div>

              <div className="text-xs mt-1">
                {slot.isWeatherLocked ? (
                  <span className="text-amber-600">Weather closed</span>
                ) : slot.availableSlots > 0 ? (
                  <span className="text-green-600">
                    {slot.availableSlots} available
                  </span>
                ) : (
                  <span className="text-red-600">Fully booked</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {slots.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-4">
          No time slots available for this date
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Selected Slot Summary & Booking */}
      {selectedSlot && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="font-bold text-blue-800">
                {selectedSlot.startTime} - {selectedSlot.endTime}
              </p>
              <p className="text-sm text-blue-600">
                {new Date(selectedSlot.slotDate).toLocaleDateString("en-PH", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <p className="text-xl font-bold text-blue-800">
              PHP {selectedSlot.currentPrice}
            </p>
          </div>

          <button
            onClick={bookSlot}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>

          <button
            onClick={() => setSelectedSlot(null)}
            className="w-full mt-2 text-gray-600 text-sm"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        {amenityName} is a 30-minute activity. Price may vary based on demand.
      </p>
    </div>
  );
};

export default AmenitySlotBooking;
