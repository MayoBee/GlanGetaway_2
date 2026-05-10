/**
 * Unit tests for booking validation service
 */

import {
  canModifyBooking,
  checkAndUpdateBookingStatus,
  calculateModificationDeadline,
  validateBookingDates,
  ModificationCheckResult
} from './bookingValidationService';

describe('Booking Validation Service', () => {
  describe('canModifyBooking', () => {
    it('should allow modification for pending booking within window', () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      const booking = {
        status: 'pending',
        changeWindowDeadline: futureDeadline,
        canModify: true
      };

      const result = canModifyBooking(booking as any);
      expect(result.canModify).toBe(true);
    });

    it('should deny modification for confirmed booking', () => {
      const booking = {
        status: 'confirmed',
        changeWindowDeadline: new Date(Date.now() - 10000),
        canModify: true
      };

      const result = canModifyBooking(booking as any);
      expect(result.canModify).toBe(false);
      expect(result.reason).toContain('no longer pending');
    });

    it('should deny modification after 8-hour window', () => {
      const now = new Date();
      const pastDeadline = new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago

      const booking = {
        status: 'pending',
        changeWindowDeadline: pastDeadline,
        canModify: true
      };

      const result = canModifyBooking(booking as any);
      expect(result.canModify).toBe(false);
      expect(result.reason).toContain('8-hour window');
    });

    it('should deny modification when canModify is explicitly false', () => {
      const now = new Date();
      const futureDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const booking = {
        status: 'pending',
        changeWindowDeadline: futureDeadline,
        canModify: false
      };

      const result = canModifyBooking(booking as any);
      expect(result.canModify).toBe(false);
      expect(result.reason).toContain('locked from modification');
    });

    it('should allow modification when no deadline is set', () => {
      const booking = {
        status: 'pending',
        canModify: true
      };

      const result = canModifyBooking(booking as any);
      expect(result.canModify).toBe(true);
    });
  });

  describe('calculateModificationDeadline', () => {
    it('should calculate deadline 8 hours from now', () => {
      const now = new Date();
      const deadline = calculateModificationDeadline(now);
      const expected = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      expect(deadline.getTime()).toBe(expected.getTime());
    });

    it('should default to current time if no timestamp provided', () => {
      const deadline = calculateModificationDeadline();
      const now = new Date();
      const expected = new Date(now.getTime() + 8 * 60 * 60 * 1000);

      // Allow for 1 second difference due to execution time
      expect(Math.abs(deadline.getTime() - expected.getTime())).toBeLessThan(1000);
    });
  });

  describe('validateBookingDates', () => {
    it('should validate correct check-in and check-out dates', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 2);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 4);

      const result = validateBookingDates(checkIn, checkOut);
      expect(result.isValid).toBe(true);
    });

    it('should reject check-in date in the past', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() - 2);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 1);

      const result = validateBookingDates(checkIn, checkOut);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('cannot be in the past');
    });

    it('should reject check-out before check-in', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 4);
      const checkOut = new Date();
      checkOut.setDate(checkOut.getDate() + 2);

      const result = validateBookingDates(checkIn, checkOut);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('after check-in');
    });

    it('should reject check-out equal to check-in', () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 2);
      const checkOut = new Date(checkIn);

      const result = validateBookingDates(checkIn, checkOut);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('after check-in');
    });
  });
});
