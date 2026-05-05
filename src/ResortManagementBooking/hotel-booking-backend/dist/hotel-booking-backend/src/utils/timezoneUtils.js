"use strict";
/**
 * Timezone Utility Functions
 * Ensures consistent timezone handling across the booking system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimezoneManager = void 0;
const luxon_1 = require("luxon");
class TimezoneManager {
    /**
     * Get the current timezone for the system
     */
    static getCurrentTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || this.DEFAULT_TIMEZONE;
    }
    /**
     * Validate if a timezone is supported
     */
    static isValidTimezone(timezone) {
        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone });
            return this.SUPPORTED_TIMEZONES.includes(timezone);
        }
        catch (_a) {
            return false;
        }
    }
    /**
     * Convert a date string to a safe DateTime object with timezone
     */
    static parseDate(dateString, timezone) {
        const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
        try {
            return luxon_1.DateTime.fromISO(dateString, { zone: tz });
        }
        catch (error) {
            throw new Error(`Invalid date format: ${dateString}`);
        }
    }
    /**
     * Get current date in specified timezone
     */
    static now(timezone) {
        const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
        return luxon_1.DateTime.now().setZone(tz);
    }
    /**
     * Start of day in specified timezone
     */
    static startOfDay(date, timezone) {
        const dt = typeof date === 'string' ? this.parseDate(date, timezone) : date;
        return dt.startOf('day');
    }
    /**
     * End of day in specified timezone
     */
    static endOfDay(date, timezone) {
        const dt = typeof date === 'string' ? this.parseDate(date, timezone) : date;
        return dt.endOf('day');
    }
    /**
     * Validate booking dates with timezone safety
     */
    static validateBookingDates(checkIn, checkOut, timezone) {
        try {
            const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
            const now = this.now(tz);
            const checkInDate = this.parseDate(checkIn, tz);
            const checkOutDate = this.parseDate(checkOut, tz);
            // Check if dates are valid
            if (!checkInDate.isValid || !checkOutDate.isValid) {
                return { isValid: false, error: 'Invalid date format' };
            }
            // Check if check-in is in the past (allow bookings for today)
            const todayStart = now.startOf('day');
            const checkInStart = checkInDate.startOf('day');
            if (checkInStart < todayStart) {
                return { isValid: false, error: 'Check-in date cannot be in the past' };
            }
            // Check if check-out is after check-in
            if (checkOutDate <= checkInDate) {
                return { isValid: false, error: 'Check-out date must be after check-in date' };
            }
            // Check if check-out is too far in the future (1 year limit)
            const maxFutureDate = now.plus({ years: 1 });
            if (checkOutDate > maxFutureDate) {
                return { isValid: false, error: 'Check-out date cannot be more than 1 year in advance' };
            }
            // Return normalized dates
            return {
                isValid: true,
                normalizedDates: {
                    checkIn: checkInDate.toUTC().toJSDate(),
                    checkOut: checkOutDate.toUTC().toJSDate()
                }
            };
        }
        catch (error) {
            return { isValid: false, error: 'Date validation failed' };
        }
    }
    /**
     * Format date for display in timezone
     */
    static formatDate(date, timezone, format = 'yyyy-MM-dd') {
        const dt = typeof date === 'string' ? this.parseDate(date, timezone) : luxon_1.DateTime.fromJSDate(date);
        const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
        return dt.setZone(tz).toFormat(format);
    }
    /**
     * Get timezone information
     */
    static getTimezoneInfo(timezone) {
        const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.getCurrentTimezone();
        const now = luxon_1.DateTime.now().setZone(tz);
        return {
            timezone: tz,
            offset: now.offset,
            isDST: now.isInDST
        };
    }
    /**
     * Convert UTC date to local timezone
     */
    static utcToLocal(utcDate, timezone) {
        const dt = typeof utcDate === 'string' ? luxon_1.DateTime.fromISO(utcDate, { zone: 'utc' }) : luxon_1.DateTime.fromJSDate(utcDate);
        const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
        return dt.setZone(tz);
    }
    /**
     * Convert local timezone date to UTC
     */
    static localToUTC(localDate, timezone) {
        const dt = typeof localDate === 'string' ? this.parseDate(localDate, timezone) : luxon_1.DateTime.fromJSDate(localDate);
        return dt.setZone('utc');
    }
}
exports.TimezoneManager = TimezoneManager;
TimezoneManager.DEFAULT_TIMEZONE = 'Asia/Manila';
TimezoneManager.SUPPORTED_TIMEZONES = [
    'Asia/Manila',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Seoul',
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Australia/Sydney'
];
