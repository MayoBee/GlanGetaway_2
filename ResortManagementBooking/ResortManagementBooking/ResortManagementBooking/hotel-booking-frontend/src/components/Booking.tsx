import React, { useState } from 'react';

const Booking: React.FC = () => {
  const [bookingDate, setBookingDate] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Booking Component</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="guestName" className="block text-sm font-medium">
            Guest Name
          </label>
          <input
            id="guestName"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Enter guest name"
          />
        </div>
        <div>
          <label htmlFor="bookingDate" className="block text-sm font-medium">
            Booking Date
          </label>
          <input
            id="bookingDate"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div className="text-sm text-gray-600">
          <p>Guest: {guestName || 'Not specified'}</p>
          <p>Date: {bookingDate || 'Not selected'}</p>
        </div>
      </div>
    </div>
  );
};

export default Booking;