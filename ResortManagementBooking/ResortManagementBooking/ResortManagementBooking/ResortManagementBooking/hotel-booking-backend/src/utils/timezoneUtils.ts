/**
 * Timezone Utility Functions
 * Ensures consistent timezone handling across the booking system
 */

import { DateTime } from 'luxon';

export interface TimezoneInfo {
  timezone: string;
  offset: number;
  isDST: boolean;
}

export class TimezoneManager {
  private static readonly DEFAULT_TIMEZONE = 'Asia/Manila';
  private static readonly SUPPORTED_TIMEZONES = [
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

  /**
   * Get the current timezone for the system
   */
  static getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || this.DEFAULT_TIMEZONE;
  }

  /**
   * Validate if a timezone is supported
   */
  static isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return this.SUPPORTED_TIMEZONES.includes(timezone);
    } catch {
      return false;
    }
  }

  /**
   * Convert a date string to a safe DateTime object with timezone
   */
  static parseDate(dateString: string, timezone?: string): DateTime {
    const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
    
    try {
      return DateTime.fromISO(dateString, { zone: tz });
    } catch (error) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
  }

  /**
   * Get current date in specified timezone
   */
  static now(timezone?: string): DateTime {
    const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
    return DateTime.now().setZone(tz);
  }

  /**
   * Start of day in specified timezone
   */
  static startOfDay(date: DateTime | string, timezone?: string): DateTime {
    const dt = typeof date === 'string' ? this.parseDate(date, timezone) : date;
    return dt.startOf('day');
  }

  /**
   * End of day in specified timezone
   */
  static endOfDay(date: DateTime | string, timezone?: string): DateTime {
    const dt = typeof date === 'string' ? this.parseDate(date, timezone) : date;
    return dt.endOf('day');
  }

  /**
   * Validate booking dates with timezone safety
   */
  static validateBookingDates(
    checkIn: string, 
    checkOut: string, 
    timezone?: string
  ): { isValid: boolean; error?: string; normalizedDates?: { checkIn: Date; checkOut: Date } } {
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

    } catch (error) {
      return { isValid: false, error: 'Date validation failed' };
    }
  }

  /**
   * Format date for display in timezone
   */
  static formatDate(date: Date | string, timezone?: string, format: string = 'yyyy-MM-dd'): string {
    const dt = typeof date === 'string' ? this.parseDate(date, timezone) : DateTime.fromJSDate(date);
    const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
    return dt.setZone(tz).toFormat(format);
  }

  /**
   * Get timezone information
   */
  static getTimezoneInfo(timezone?: string): TimezoneInfo {
    const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.getCurrentTimezone();
    const now = DateTime.now().setZone(tz);
    
    return {
      timezone: tz,
      offset: now.offset,
      isDST: now.isInDST
    };
  }

  /**
   * Convert UTC date to local timezone
   */
  static utcToLocal(utcDate: Date | string, timezone?: string): DateTime {
    const dt = typeof utcDate === 'string' ? DateTime.fromISO(utcDate, { zone: 'utc' }) : DateTime.fromJSDate(utcDate);
    const tz = timezone && this.isValidTimezone(timezone) ? timezone : this.DEFAULT_TIMEZONE;
    return dt.setZone(tz);
  }

  /**
   * Convert local timezone date to UTC
   */
  static localToUTC(localDate: Date | string, timezone?: string): DateTime {
    const dt = typeof localDate === 'string' ? this.parseDate(localDate, timezone) : DateTime.fromJSDate(localDate);
    return dt.setZone('utc');
  }
}
