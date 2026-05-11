"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WATER_ACTIVITY_TYPES = exports.AmenityWeatherLock = exports.AmenitySlot = void 0;
// Backwards compatibility - re-export from domain structure
var amenity_slot_1 = require("../domains/booking/models/amenity-slot");
Object.defineProperty(exports, "AmenitySlot", { enumerable: true, get: function () { return amenity_slot_1.AmenitySlot; } });
Object.defineProperty(exports, "AmenityWeatherLock", { enumerable: true, get: function () { return amenity_slot_1.AmenityWeatherLock; } });
Object.defineProperty(exports, "WATER_ACTIVITY_TYPES", { enumerable: true, get: function () { return amenity_slot_1.WATER_ACTIVITY_TYPES; } });
