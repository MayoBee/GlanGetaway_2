import { Document, Types } from "mongoose";

// Utility type to handle ObjectId vs string conflicts
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
}

// Helper function to convert ObjectId to string
export function objectIdToString(id: Types.ObjectId | string): string {
  return id.toString();
}

// Helper function to convert string to ObjectId
export function stringToObjectId(id: string | Types.ObjectId): Types.ObjectId {
  if (typeof id === 'string') {
    return new Types.ObjectId(id);
  }
  return id;
}
