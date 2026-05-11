/**
 * Timezone Safety Tests
 * Tests timezone-aware date handling and validation
 */

import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createAndConfigureApp } from '../../bootstrap';
import User from '../../domains/identity/models/user';
import Hotel from '../../domains/hotel/models/hotel';
import { TimezoneManager } from '../../utils/timezoneUtils';

describe('Timezone Safety', () => {
  let app: any;
  let testHotel: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Increase timeout for test setup
    jest.setTimeout(30000);
    app = createAndConfigureApp();
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const user = new User({
      email: `timezone-test-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    await user.save();
    userId = user._id.toString();
    
    // Generate auth token
    authToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || 'test-secret-key',
      { expiresIn: '7d' }
    );

    // Create test hotel
    testHotel = new Hotel({
      userId: userId, // Add required userId field
      name: 'Timezone Test Resort',
      city: 'Test City',
      country: 'Philippines',
      description: 'A resort for timezone testing',
      type: ['Beach Resort'],
      facilities: ['pool'],
      dayRate: 1000,
      nightRate: 2000,
      hasDayRate: true,
      hasNightRate: true,
      starRating: 3,
      imageUrls: [],
      isApproved: true,
      status: 'approved',
      rooms: [{
        id: 'room-001',
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      totalBookings: 0,
      lastUpdated: new Date()
    });
    await testHotel.save();
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (testHotel && testHotel._id) {
        await Hotel.deleteMany({ _id: testHotel._id });
      }
      if (userId) {
        await User.deleteMany({ _id: userId });
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    // Clear any existing bookings
    if (testHotel && testHotel._id) {
      const Booking = mongoose.model('Booking');
      await Booking.deleteMany({ hotelId: testHotel._id });
    }
  });

  it('should handle booking requests with different timezones correctly', async () => {
    // Test with Manila timezone
    const manilaCheckIn = new Date();
    manilaCheckIn.setDate(manilaCheckIn.getDate() + 1);
    const manilaCheckOut = new Date();
    manilaCheckOut.setDate(manilaCheckOut.getDate() + 2);

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: manilaCheckIn.toISOString(),
      checkOut: manilaCheckOut.toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Timezone', 'Asia/Manila')
      .send(bookingPayload);

    expect(response.status).toBe(201);
    expect(response.body.message).toContain('created successfully');
  });

  it('should reject bookings with past dates in different timezones', async () => {
    // Create a date that's in the past in Manila timezone
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: pastDate.toISOString(),
      checkOut: new Date().toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Timezone', 'Asia/Manila')
      .send(bookingPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('past');
    expect(response.body.timezone).toBeDefined();
    expect(response.body.clientTimezone).toBe('Asia/Manila');
  });

  it('should handle invalid timezone gracefully', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: futureDate.toISOString(),
      checkOut: new Date(futureDate.getTime() + 86400000).toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Timezone', 'Invalid/Timezone')
      .send(bookingPayload);

    // Should fall back to default timezone and succeed
    expect(response.status).toBe(201);
  });

  it('should prevent bookings too far in the future', async () => {
    // Create a date more than 1 year in the future
    const farFutureDate = new Date();
    farFutureDate.setFullYear(farFutureDate.getFullYear() + 2);

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: farFutureDate.toISOString(),
      checkOut: new Date(farFutureDate.getTime() + 86400000).toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookingPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('year');
  });

  it('should validate date formats correctly', async () => {
    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: 'invalid-date-format',
      checkOut: new Date().toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookingPayload);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('validation failed');
  });

  it('should handle timezone edge cases correctly', async () => {
    // Test booking across midnight boundary
    const tonight = new Date();
    tonight.setHours(23, 30, 0, 0); // 11:30 PM
    const tomorrowMorning = new Date(tonight);
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(1, 30, 0, 0); // 1:30 AM next day

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: tonight.toISOString(),
      checkOut: tomorrowMorning.toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Timezone Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('X-Timezone', 'Asia/Manila')
      .send(bookingPayload);

    // Should handle the midnight crossing correctly
    expect([201, 400]).toContain(response.status);
  });
});

// Unit tests for TimezoneManager
describe('TimezoneManager Unit Tests', () => {
  it('should validate supported timezones', () => {
    expect(TimezoneManager.isValidTimezone('Asia/Manila')).toBe(true);
    expect(TimezoneManager.isValidTimezone('UTC')).toBe(true);
    expect(TimezoneManager.isValidTimezone('Invalid/Timezone')).toBe(false);
  });

  it('should parse dates correctly', () => {
    const dateString = '2024-12-25T10:00:00.000Z';
    const parsed = TimezoneManager.parseDate(dateString, 'Asia/Manila');
    expect(parsed.isValid).toBe(true);
    expect(parsed.year).toBe(2024);
    expect(parsed.month).toBe(12);
    expect(parsed.day).toBe(25);
  });

  it('should validate booking dates correctly', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const validation = TimezoneManager.validateBookingDates(
      tomorrow.toISOString(),
      dayAfter.toISOString(),
      'Asia/Manila'
    );

    expect(validation.isValid).toBe(true);
    expect(validation.normalizedDates).toBeDefined();
  });

  it('should reject invalid booking dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const today = new Date();

    const validation = TimezoneManager.validateBookingDates(
      yesterday.toISOString(),
      today.toISOString(),
      'Asia/Manila'
    );

    expect(validation.isValid).toBe(false);
    expect(validation.error).toContain('past');
  });

  it('should get timezone information', () => {
    const info = TimezoneManager.getTimezoneInfo('Asia/Manila');
    expect(info.timezone).toBe('Asia/Manila');
    expect(typeof info.offset).toBe('number');
    expect(typeof info.isDST).toBe('boolean');
  });

  it('should format dates correctly', () => {
    const dateString = '2024-12-25T10:00:00.000Z';
    const formatted = TimezoneManager.formatDate(dateString, 'Asia/Manila', 'yyyy-MM-dd');
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
