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
// Hotel Domain Public API
__exportStar(require("./models/hotel"), exports);
__exportStar(require("./models/room"), exports);
__exportStar(require("./models/amenity"), exports);
__exportStar(require("./models/activity"), exports);
__exportStar(require("./models/pricing"), exports);
__exportStar(require("./models/review"), exports);
// Public services will be exported here
// export * from './services/hotel.service';
// export * from './services/room.service';
// export * from './services/inventory.service';
// Public routes will be exported here
// export * from './routes/hotel.routes';
// export * from './routes/room.routes';
// Public repository interfaces
// export * from './repositories/hotel.repository';
// export * from './repositories/room.repository';
