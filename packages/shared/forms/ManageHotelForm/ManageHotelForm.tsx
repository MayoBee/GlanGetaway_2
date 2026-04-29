import React, { useState } from 'react';

interface ManageHotelFormProps {
  hotel?: any;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export const ManageHotelForm = ({ hotel, onSubmit, onCancel }: ManageHotelFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(hotel);
  };

  // Modal states for custom package items
  const [showCustomRoomModal, setShowCustomRoomModal] = useState(false);
  const [showCustomCottageModal, setShowCustomCottageModal] = useState(false);
  const [showCustomAmenityModal, setShowCustomAmenityModal] = useState(false);
  const [activePackageIndex, setActivePackageIndex] = useState<number | null>(null);

  // Accordion states for collapsible sections
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());
  const [expandedCottages, setExpandedCottages] = useState<Set<string>>(new Set());
  const [expandedAmenities, setExpandedAmenities] = useState<Set<string>>(new Set());
  const [expandedChildFees, setExpandedChildFees] = useState<Set<string>>(new Set());

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Hotel Name</label>
        <input
          type="text"
          defaultValue={hotel?.name}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
          Save
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ManageHotelForm;
