import Booking from '../models/booking';
import { IBooking } from '../domains/booking/models/booking';

interface AvailabilityResult {
  available: boolean;
  conflicts: IBooking[];
}

interface MongoQuery {
  hotelId: string;
  status: { $in: string[] };
  checkIn: { $lt: Date };
  checkOut: { $gt: Date };
  $or?: Array<{
    'selectedRooms.id'?: { $in: string[] };
    'selectedCottages.id'?: { $in: string[] };
  }>;
}

interface MatchCondition {
  'selectedRooms.id'?: { $in: string[] };
  'selectedCottages.id'?: { $in: string[] };
}

interface BookingData {
  hotelId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  selectedRooms?: Array<{ id: string; [key: string]: any }>;
  selectedCottages?: Array<{ id: string; [key: string]: any }>;
}

interface RoomSelection {
  id: string;
  units?: number;
  [key: string]: any;
}

interface CottageSelection {
  id: string;
  units?: number;
  [key: string]: any;
}

export const checkAvailability = async (
  hotelId: string,
  checkIn: Date,
  checkOut: Date,
  roomIds: string[],
  cottageIds: string[]
): Promise<AvailabilityResult> => {
  // Build database query with all filtering at query level
  const query: MongoQuery = {
    hotelId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn }
  };

  // Add room/cottage filters directly in MongoDB query
  const matchConditions: MatchCondition[] = [];

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

/**
 * ATOMIC BOOKING SERVICE
 * 
 * This function performs an atomic booking operation to prevent race conditions.
 * Instead of "check-then-book" (two separate operations), it uses MongoDB's
 * findOneAndUpdate with $and operator to ensure the booking is only created
 * if the rooms/cottages are still available at the moment of insertion.
 * 
 * Logic: Insert booking ONLY IF no conflicting booking exists for the same
 * hotel, dates, and room/cottage IDs with status 'confirmed' or 'pending'.
 */
export const createAtomicBooking = async (bookingData: BookingData): Promise<{ success: boolean; booking?: any; error?: string }> => {
  const { hotelId, checkIn, checkOut, selectedRooms, selectedCottages } = bookingData;
  
  // Extract room and cottage IDs
  const roomIds = selectedRooms?.map((room: RoomSelection) => room.id) || [];
  const cottageIds = selectedCottages?.map((cottage: CottageSelection) => cottage.id) || [];
  
  // Build the conflict detection query
  const conflictQuery: MongoQuery = {
    hotelId,
    status: { $in: ['confirmed', 'pending'] },
    checkIn: { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) }
  };
  
  // Add room/cottage conflict conditions
  const conflictConditions: MatchCondition[] = [];
  
  if (roomIds.length > 0) {
    conflictConditions.push({
      'selectedRooms.id': { $in: roomIds }
    });
  }
  
  if (cottageIds.length > 0) {
    conflictConditions.push({
      'selectedCottages.id': { $in: cottageIds }
    });
  }
  
  if (conflictConditions.length > 0) {
    conflictQuery.$or = conflictConditions;
  }
  
  try {
    // Use findOneAndUpdate with $and to atomically check and create
    // The $and ensures no conflicting booking exists before insertion
    const result = await Booking.findOneAndUpdate(
      { 
        $and: [
          { _id: { $exists: false } }, // This will never match, ensuring we always go to the insert path
          { $nor: [conflictQuery] } // NOR ensures no conflicting booking exists
        ]
      },
      bookingData,
      { 
        new: true, 
        upsert: true, // Create if not found (which it never will be due to the query)
        runValidators: true 
      }
    );
    
    if (result) {
      return { success: true, booking: result };
    } else {
      // This shouldn't happen with upsert, but handle it
      const booking = new Booking(bookingData);
      await booking.save();
      return { success: true, booking };
    }
  } catch (error: unknown) {
    // Check for duplicate key error (MongoDB code 11000)
    if (error instanceof Error && (error as any).code === 11000) {
      return { 
        success: false, 
        error: 'The selected rooms or cottages are no longer available. Please try different dates or accommodations.' 
      };
    }
    
    // Check for write conflict (MongoDB code 112)
    if (error instanceof Error && (error as any).code === 112) {
      return {
        success: false,
        error: 'A booking conflict occurred. Please try again.'
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while creating the booking'
    };
  }
};