import request from 'supertest';
import mongoose from 'mongoose';
import { createAndConfigureApp } from '../../bootstrap';
import Hotel from '../../models/hotel';
import Booking from '../../models/booking';
import User from '../../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Test suite for transaction rollback testing
// This verifies that if any part of the booking flow fails,
// the entire transaction is rolled back and no orphaned records exist

describe('Transaction Rollback', () => {
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
      email: 'rollback-test@example.com',
      password: hashedPassword,
      firstName: 'Rollback',
      lastName: 'Test',
      role: 'user',
      totalBookings: 0
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
      userId: userId,
      name: 'Rollback Test Resort',
      city: 'Glan',
      country: 'Philippines',
      description: 'Test resort for transaction rollback testing',
      type: ['beach'],
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
        name: 'Single Room',
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
        await Booking.deleteMany({ hotelId: testHotel._id });
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
    // Clear bookings and reset counters before each test
    if (testHotel && testHotel._id) {
      await Booking.deleteMany({ hotelId: testHotel._id });
      await Hotel.findByIdAndUpdate(testHotel._id, { totalBookings: 0 });
    }
    if (userId) {
      await User.findByIdAndUpdate(userId, { totalBookings: 0 });
    }
  });

  it('should rollback booking when availability conflict occurs', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

    // First, create a confirmed booking for the same room and dates
    const existingBooking = new Booking({
      userId,
      hotelId: testHotel._id,
      firstName: 'Existing',
      lastName: 'Booking',
      email: 'existing@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn,
      checkOut,
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Single Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card',
      status: 'confirmed',
      paymentStatus: 'paid',
      changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      canModify: true
    });
    await existingBooking.save();

    // Now try to book the same room for the same dates
    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Single Room',
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

    // Should fail with conflict
    expect(response.status).toBe(409);
    expect(response.body.message).toContain('availability');

    // Verify only the original booking exists
    const bookings = await Booking.find({ hotelId: testHotel._id });
    expect(bookings.length).toBe(1);
    expect(bookings[0]._id.toString()).toBe(existingBooking._id.toString());

    // Verify hotel count was NOT incremented (stays at 1)
    const hotel = await Hotel.findById(testHotel._id);
    expect(hotel?.totalBookings).toBe(0); // Should be 0 because the new booking was rolled back
    // Actually it's 1 from the existing booking that we manually created, 
    // so the route didn't increment it. Let me check...
    // The existing booking was created directly, not through the route
    // So totalBookings should be 0
    expect(hotel?.totalBookings).toBe(0);
  });

  it('should maintain consistency between booking and counters', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 3);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 4);

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Single Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    // Create a successful booking
    const response = await request(app)
      .post(`/api/hotels/${testHotel._id}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookingPayload);

    expect(response.status).toBe(201);

    // Verify all counters are consistent
    const bookings = await Booking.find({ hotelId: testHotel._id });
    const hotel = await Hotel.findById(testHotel._id);
    const user = await User.findById(userId);

    // Hotel totalBookings should equal the count of confirmed/pending bookings
    expect(hotel?.totalBookings).toBe(bookings.length);
    
    // User totalBookings should also match
    expect(user?.totalBookings).toBe(bookings.length);
  });

  it('should prevent orphaned bookings on concurrent requests', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 5);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 6);

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Single Room',
        type: 'standard',
        pricePerNight: 2000,
        minOccupancy: 1,
        maxOccupancy: 2
      }],
      paymentMethod: 'card'
    };

    // Fire multiple requests simultaneously
    const requests = Array(10).fill(null).map(() => 
      request(app)
        .post(`/api/hotels/${testHotel._id}/bookings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingPayload)
    );

    await Promise.all(requests);

    // Verify no orphaned bookings
    // All counts should be consistent
    const bookings = await Booking.find({ hotelId: testHotel._id });
    const hotel = await Hotel.findById(testHotel._id);
    const user = await User.findById(userId);

    // Exactly one booking should exist
    expect(bookings.length).toBe(1);
    
    // Counter should match booking count
    expect(hotel?.totalBookings).toBe(bookings.length);
    expect(user?.totalBookings).toBe(bookings.length);
  });

  it('should handle invalid hotel ID gracefully', async () => {
    const fakeHotelId = new mongoose.Types.ObjectId();

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: new Date().toISOString(),
      checkOut: new Date(Date.now() + 86400000).toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [],
            paymentMethod: 'card'
    };

    const response = await request(app)
      .post(`/api/hotels/${fakeHotelId}/bookings`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookingPayload);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Hotel not found');
  });

  it('should handle past check-in dates', async () => {
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
        name: 'Single Room',
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
    expect(response.body.message).toContain('past');
  });

  it('should handle check-out before check-in', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 6); // Before check-in

    const bookingPayload = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      adultCount: 1,
      childCount: 0,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalCost: 2000,
      basePrice: 2000,
      selectedRooms: [{ 
        id: testHotel.rooms[0].id, 
        name: 'Single Room',
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
    expect(response.body.message).toContain('after');
  });
});
