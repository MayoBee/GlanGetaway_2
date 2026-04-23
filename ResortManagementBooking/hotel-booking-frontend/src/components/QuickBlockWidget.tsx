import React, { useState, useEffect } from "react";
import axios from "axios";
import { axiosInstance, getApiBaseUrl } from '@glan-getaway/shared-auth';

interface QuickBlockWidgetProps {
  hotelId: string;
  roomId: string;
  roomNumber: string;
  onBlockCreated?: (block: any) => void;
  onBlockReleased?: () => void;
}

interface ActiveBlock {
  id: string;
  expiresAt: string;
  minutesRemaining: number;
  guestName?: string;
  guestPhone?: string;
}

export const QuickBlockWidget: React.FC<QuickBlockWidgetProps> = ({
  hotelId,
  roomId,
  roomNumber,
  onBlockCreated,
  onBlockReleased,
}) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [activeBlock, setActiveBlock] = useState<ActiveBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Poll for block status
  useEffect(() => {
    checkBlockStatus();

    const interval = setInterval(checkBlockStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [roomId]);

  // Countdown timer
  useEffect(() => {
    if (!activeBlock) return;

    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(activeBlock.expiresAt).getTime() - Date.now()) / 60000
        )
      );

      if (remaining <= 0) {
        setIsBlocked(false);
        setActiveBlock(null);
        onBlockReleased?.();
      } else {
        setActiveBlock((prev) =>
          prev ? { ...prev, minutesRemaining: remaining } : null
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeBlock?.expiresAt]);

  const checkBlockStatus = async () => {
    try {
      const response = await axios.get(
        `${getApiBaseUrl()}/api/room-blocks/room/${roomId}`
      );
      if (response.data.isBlocked) {
        setIsBlocked(true);
        setActiveBlock(response.data.block);
      } else {
        setIsBlocked(false);
        setActiveBlock(null);
      }
    } catch (err) {
      console.error("Error checking block status:", err);
    }
  };

  const createQuickBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("session_id");
      const response = await axios.post(
        `${getApiBaseUrl()}/api/room-blocks/quick-block`,
        {
          hotelId,
          roomId,
          guestName: guestName || "Phone Inquiry",
          guestPhone,
          reason: "Phone inquiry - awaiting deposit",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsBlocked(true);
      setActiveBlock({
        id: response.data.block.id,
        expiresAt: response.data.block.expiresAt,
        minutesRemaining: response.data.block.minutesRemaining,
        guestName,
        guestPhone,
      });
      setShowForm(false);
      setGuestName("");
      setGuestPhone("");
      onBlockCreated?.(response.data.block);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create block");
    } finally {
      setLoading(false);
    }
  };

  const releaseBlock = async () => {
    if (!activeBlock) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("session_id");
      await axios.post(
        `${getApiBaseUrl()}/api/room-blocks/${activeBlock.id}/release`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsBlocked(false);
      setActiveBlock(null);
      onBlockReleased?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to release block");
    } finally {
      setLoading(false);
    }
  };

  const extendBlock = async () => {
    if (!activeBlock) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("session_id");
      const response = await axios.post(
        `${getApiBaseUrl()}/api/room-blocks/${activeBlock.id}/extend`,
        { additionalMinutes: 15 },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActiveBlock({
        ...activeBlock,
        expiresAt: response.data.block.expiresAt,
        minutesRemaining: response.data.block.minutesRemaining,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to extend block");
    } finally {
      setLoading(false);
    }
  };

  // Mobile-first design
  if (isBlocked && activeBlock) {
    return (
      <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
            <span className="font-bold text-amber-800">ROOM BLOCKED</span>
          </div>
          <span className="text-2xl font-bold text-amber-600">
            {activeBlock.minutesRemaining}m
          </span>
        </div>

        <div className="text-sm text-amber-700 mb-3">
          {activeBlock.guestName && (
            <p>Guest: {activeBlock.guestName}</p>
          )}
          {activeBlock.guestPhone && (
            <p>Phone: {activeBlock.guestPhone}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-amber-200 rounded-full h-2 mb-3">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
            style={{
              width: `${(activeBlock.minutesRemaining / 15) * 100}%`,
            }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={extendBlock}
            disabled={loading}
            className="flex-1 bg-amber-500 text-white py-2 px-3 rounded-lg font-medium text-sm hover:bg-amber-600 disabled:opacity-50"
          >
            +15 min
          </button>
          <button
            onClick={releaseBlock}
            disabled={loading}
            className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg font-medium text-sm hover:bg-gray-600 disabled:opacity-50"
          >
            Release
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
        <h3 className="font-bold text-blue-800 mb-3">
          Quick Block Room {roomNumber}
        </h3>

        <form onSubmit={createQuickBlock}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Guest Name (optional)
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
              placeholder="Enter name"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Phone Number (optional)
            </label>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm"
              placeholder="09XX XXX XXXX"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-3">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Blocking..." : "Block Room"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg font-medium text-sm hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="text-xs text-blue-600 mt-2">
          Room will be blocked for 15 minutes. Auto-releases if no booking is made.
        </p>
      </div>
    );
  }

  // Default: Show block button
  return (
    <button
      onClick={() => setShowForm(true)}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
    >
      📞 Quick Block (15 min)
    </button>
  );
};

export default QuickBlockWidget;
