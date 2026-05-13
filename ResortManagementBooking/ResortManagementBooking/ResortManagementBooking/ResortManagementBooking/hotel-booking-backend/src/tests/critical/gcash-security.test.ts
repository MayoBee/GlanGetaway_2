import request from 'supertest';
import mongoose from 'mongoose';
import { createAndConfigureApp } from '../../bootstrap';
import Hotel from '../../models/hotel';
import Booking from '../../models/booking';
import User from '../../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Test suite for GCash security testing
// This verifies duplicate reference numbers are rejected and payment security works

describe('GCash Security', () => {
  let app: any;
  let testHotel: any;
  let authToken: string;
  let ownerToken: string;
  let userId: string;
  let ownerId: string;

  beforeAll(async () => {
    // Increase timeout for test setup
    jest.setTimeout(30000);
    app = createAndConfigureApp();
    
    // Create test user (booker)
    const hashedPassword = await bcrypt.hash('testpassword123', 12);
    const user = new User({
      email: `test-user-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    await user.save();
    userId = user._id.toString();
    
    // Create test user (resort owner)
    const owner = new User({
      email: `test-owner-${Date.now()}@example.com`,
      password: hashedPassword,
      firstName: 'Owner',
      lastName: 'User',
      role: 'resort_owner'
    });
    await owner.save();
    ownerId = owner._id.toString();
    
    // Generate auth tokens
    authToken = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET_KEY || 'test-secret-key',
      { expiresIn: '7d' }
    );
    
    ownerToken = jwt.sign(
      { userId: owner._id, email: owner.email, role: owner.role },
      process.env.JWT_SECRET_KEY || 'test-secret-key',
      { expiresIn: '7d' }
    );
    
    // Create test hotel owned by owner
    testHotel = new Hotel({
      userId: ownerId,
      name: 'Test GCash Resort',
      city: 'Glan',
      country: 'Philippines',
      description: 'Test resort for GCash security testing',
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
      gcashNumber: '09171234567',
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
      if (userId || ownerId) {
        await User.deleteMany({ $or: [{ _id: userId }, { _id: ownerId }] });
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  });

  beforeEach(async () => {
    // Clear bookings before each test
    if (testHotel && testHotel._id) {
      await Booking.deleteMany({ hotelId: testHotel._id });
    }
  });

  it('should reject duplicate GCash reference numbers', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

    // Create first booking with GCash payment
    const booking1 = new Booking({
      userId,
      hotelId: testHotel._id,
      firstName: 'Test',
      lastName: 'User',
      email: `test-user-${Date.now()}@example.com`,
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
      paymentMethod: 'gcash',
      status: 'pending',
      paymentStatus: 'pending',
      gcashPayment: {
        gcashNumber: '09171234567',
        referenceNumber: 'REF-123456789',
        amountPaid: 1000,
        paymentTime: new Date(),
        status: 'pending'
      },
      changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      canModify: true
    });
    await booking1.save();

    // Verify first booking (should succeed)
    const verifyResponse1 = await request(app)
      .patch(`/api/bookings/${booking1._id}/gcash/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'verified' });

    expect(verifyResponse1.status).toBe(200);
    expect(verifyResponse1.body.message).toContain('verified');

    // Create second booking with SAME reference number
    const booking2 = new Booking({
      userId,
      hotelId: testHotel._id,
      firstName: 'Test',
      lastName: 'User',
      email: `test-user-${Date.now()}@example.com`,
      adultCount: 1,
      childCount: 0,
      checkIn: new Date(checkOut.getTime() + 86400000),
      checkOut: new Date(checkOut.getTime() + 2 * 86400000),
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
      paymentMethod: 'gcash',
      status: 'pending',
      paymentStatus: 'pending',
      gcashPayment: {
        gcashNumber: '09171234567',
        referenceNumber: 'REF-123456789', // SAME reference number
        amountPaid: 1000,
        paymentTime: new Date(),
        status: 'pending'
      },
      changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      canModify: true
    });
    await booking2.save();

    // Try to verify second booking with duplicate reference (should fail)
    const verifyResponse2 = await request(app)
      .patch(`/api/bookings/${booking2._id}/gcash/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'verified' });

    expect(verifyResponse2.status).toBe(400);
    expect(verifyResponse2.body.message).toContain('already been used');
  });

  it('should allow same reference number for rejected payments', async () => {
    // A rejected payment's reference number should be allowed to be reused
    // because the payment was never actually completed
    
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 3);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 4);

    // Create first booking and reject it
    const booking1 = new Booking({
      userId,
      hotelId: testHotel._id,
      firstName: 'Test',
      lastName: 'User',
      email: `test-user-${Date.now()}@example.com`,
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
      paymentMethod: 'gcash',
      status: 'cancelled',
      paymentStatus: 'failed',
      gcashPayment: {
        gcashNumber: '09171234567',
        referenceNumber: 'REF-REJECTED-001',
        amountPaid: 1000,
        paymentTime: new Date(),
        status: 'rejected'
      },
      changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      canModify: true,
      cancellationReason: 'GCash payment rejected'
    });
    await booking1.save();

    // Create second booking with same reference number (rejected one)
    const booking2 = new Booking({
      userId,
      hotelId: testHotel._id,
      firstName: 'Test',
      lastName: 'User',
      email: `test-user-${Date.now()}@example.com`,
      adultCount: 1,
      childCount: 0,
      checkIn: new Date(checkOut.getTime() + 86400000),
      checkOut: new Date(checkOut.getTime() + 2 * 86400000),
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
      paymentMethod: 'gcash',
      status: 'pending',
      paymentStatus: 'pending',
      gcashPayment: {
        gcashNumber: '09171234567',
        referenceNumber: 'REF-REJECTED-001', // Same reference but first was rejected
        amountPaid: 1000,
        paymentTime: new Date(),
        status: 'pending'
      },
      changeWindowDeadline: new Date(Date.now() + 8 * 60 * 60 * 1000),
      canModify: true
    });
    await booking2.save();

    // Try to verify second booking - should succeed since first was rejected
    const verifyResponse = await request(app)
      .patch(`/api/bookings/${booking2._id}/gcash/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'verified' });

    // This test documents expected behavior: rejected references MAY be reused
    // The system should track this based on business requirements
    expect(verifyResponse.status).toBe(200);
  });

  it('should handle GCash verification for non-existent booking', async () => {
    const fakeBookingId = new mongoose.Types.ObjectId();
    
    const response = await request(app)
      .patch(`/api/bookings/${fakeBookingId}/gcash/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'verified' });

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('Booking not found');
  });

  it('should reject GCash verification for non-GCash bookings', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 5);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 6);

    // Create card payment booking
    const booking = new Booking({
      userId,
      hotelId: testHotel._id,
      firstName: 'Test',
      lastName: 'User',
      email: `test-user-${Date.now()}@example.com`,
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
    await booking.save();

    const response = await request(app)
      .patch(`/api/bookings/${booking._id}/gcash/verify`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'verified' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('not a GCash booking');
  });
});
