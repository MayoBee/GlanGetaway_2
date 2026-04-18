import Booking, { IBooking } from '../models/booking';

interface AvailabilityResult {
  available: boolean;
  conflicts: IBooking[];
}

export const checkAvailability = async (
  hotelId: string,
  checkIn: Date,
  checkOut: Date,
  roomIds: string[],
  cottageIds: string[]
): Promise<AvailabilityResult> => {
  // Build database query with all filtering at query level
  const query: any = {
    hotelId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  };

  // Add room/cottage filters directly in MongoDB query
  const matchConditions: any[] = [];

  if (roomIds && roomIds.length > 0) {
    matchConditions.push({
      'selectedRooms.id': { $in: roomIds }
    });
  }

  if (cottageIds && cottageIds.length > 0) {
    matchConditions.push({
      'selectedCottages.id': { $in: cottageIds }
    });
  }

  if (matchConditions.length > 0) {
    query.$or = matchConditions;
  }

  // Only fetch required fields with projection
  const conflicts = await Booking.find(query)
    .select('selectedRooms selectedCottages checkIn checkOut status guestName')
    .lean() as IBooking[];

  return {
    available: conflicts.length === 0,
    conflicts
  };
};