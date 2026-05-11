"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Booking Domain Public API
__exportStar(require("./models/booking"), exports);
__exportStar(require("./models/activity-booking"), exports);
__exportStar(require("./models/amenity-booking"), exports);
__exportStar(require("./models/amenity-slot"), exports);
__exportStar(require("./models/room-block"), exports);
// Public services will be exported here
// export * from './services/booking.service';
// export * from './services/availability.service';
// Public routes will be exported here
// export * from './routes/booking.routes';
// Public repository interfaces
// export * from './repositories/booking.repository';
