const mongoose = require('mongoose');
const Booking = require('./hotel-booking-backend/src/models/booking');

mongoose.connect('mongodb://localhost:27017/hotel-booking')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check for any bookings with payment intent IDs
    const bookingsWithPaymentIntent = await Booking.find({ paymentIntentId: { $exists: true } });
    console.log('Total bookings with payment intent:', bookingsWithPaymentIntent.length);
    
    // Check for the specific payment intent ID from the logs
    const specificBooking = await Booking.findOne({ paymentIntentId: /pi_3TRZySBtUyxkgng02bIkrnI2/ });
    console.log('Specific booking found:', specificBooking ? 'YES' : 'NO');
    if (specificBooking) {
      console.log('Booking ID:', specificBooking._id);
      console.log('Hotel ID:', specificBooking.hotelId);
      console.log('Status:', specificBooking.status);
      console.log('Payment Intent ID:', specificBooking.paymentIntentId);
    }
    
    // Show recent bookings
    const recentBookings = await Booking.find().sort({ createdAt: -1 }).limit(5);
    console.log('Recent bookings:', recentBookings.length);
    recentBookings.forEach(b => {
      console.log('  - ID:', b._id, 'PaymentIntent:', b.paymentIntentId, 'Status:', b.status);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
