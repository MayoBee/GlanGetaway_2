import mongoose from "mongoose";
import { UserType, HotelType, BookingType, UserRole } from "../../../packages/shared/types";

// Backend only mongoose document interfaces
export interface UserDocument extends Omit<mongoose.Document, '_id'>, Omit<UserType, 'role'> {
  _id: string;
  role: UserRole;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Re-export all shared types for backend usage
export * from "../../../packages/shared/types";
