"use strict";
// Shared API Types - Single source of truth for both frontend and backend
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
// No circular dependencies - both frontend and backend import ONLY from this file
var UserRole;
(function (UserRole) {
    UserRole["SuperAdmin"] = "superadmin";
    UserRole["Admin"] = "admin";
    UserRole["User"] = "user";
    UserRole["Owner"] = "owner";
    UserRole["ResortOwner"] = "resort_owner";
    UserRole["FrontDesk"] = "front_desk";
    UserRole["Housekeeping"] = "housekeeping";
})(UserRole || (exports.UserRole = UserRole = {}));
