// Hotel & Inventory Public API
// Only public operations, DTOs and interfaces are exported here

export * from '../types/hotel.types';
export * from '../services/hotel.service';
export * from '../services/room.service';
export * from '../services/amenity.service';
export * from '../services/pricing.service';

// Re-export models only for type references
export type { default as Hotel } from '../models/hotel';
export type { default as Room } from '../models/room';
export type { default as Amenity } from '../models/amenity';
export type { default as AmenitySlot } from '../models/amenity-slot';
export type { default as Activity } from '../models/activity';
export type { default as Pricing } from '../models/pricing';
export type { default as Discount } from '../models/discount';
