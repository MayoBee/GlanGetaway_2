// BACKWARDS COMPATIBILITY LAYER
// Old model imports will continue working exactly as before
// All existing code that imports from '../models' still functions

export { default as User } from '../domains/identity-access/models/user';
export { default as IdentityVerification } from '../domains/identity-access/models/identity-verification';
export { default as VerificationDocument } from '../domains/identity-access/models/verification-document';

export { default as Booking } from '../domains/booking-reservation/models/booking';
export { default as RoomBlock } from '../domains/booking-reservation/models/room-block';
export { default as AmenityBooking } from '../domains/booking-reservation/models/amenity-booking';
export { default as ActivityBooking } from '../domains/booking-reservation/models/activity-booking';
export { default as Review } from '../domains/booking-reservation/models/review';

export { default as Hotel } from '../domains/hotel-inventory/models/hotel';
export { default as Room } from '../domains/hotel-inventory/models/room';
export { default as Amenity } from '../domains/hotel-inventory/models/amenity';
export { default as AmenitySlot } from '../domains/hotel-inventory/models/amenity-slot';
export { default as Activity } from '../domains/hotel-inventory/models/activity';
export { default as Pricing } from '../domains/hotel-inventory/models/pricing';
export { default as Discount } from '../domains/hotel-inventory/models/discount';
export { default as Maintenance } from '../domains/hotel-inventory/models/maintenance';
export { default as Housekeeping } from '../domains/hotel-inventory/models/housekeeping';
export { default as HousekeepingTask } from '../domains/hotel-inventory/models/housekeeping-task';

export { default as Billing } from '../domains/billing-payments/models/billing';
export { default as Payment } from '../domains/billing-payments/models/payment';

export { default as Report } from '../domains/admin-operations/models/report';
export { default as Analytics } from '../domains/admin-operations/models/analytics';
export { default as Notification } from '../domains/admin-operations/models/notification';
export { default as WeatherTrigger } from '../domains/admin-operations/models/weather-trigger';
export { default as WebsiteFeedback } from '../domains/admin-operations/models/website-feedback';
