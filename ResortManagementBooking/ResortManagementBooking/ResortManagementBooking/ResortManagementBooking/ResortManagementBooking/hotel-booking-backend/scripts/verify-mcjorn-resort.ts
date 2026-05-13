import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import dotenv from 'dotenv';

dotenv.config();

async function verifyMcJornResort() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking');
    
    const resort = await Hotel.findOne({ name: 'McJorn Shoreline Beach Resort' });
    
    if (resort) {
      console.log('=== McJorn Beach Resort Verification ===');
      console.log('Name:', resort.name);
      console.log('Status:', resort.isApproved ? 'APPROVED' : 'PENDING');
      console.log('Location:', resort.city + ', ' + resort.country);
      console.log('Contact:', resort.contact?.phone, resort.contact?.email);
      console.log('Cottages:', resort.cottages?.length || 0);
      console.log('Rooms:', resort.rooms?.length || 0);
      console.log('Amenities:', resort.amenities?.length || 0);
      console.log('Packages:', resort.packages?.length || 0);
      console.log('Day Rate:', resort.hasDayRate ? '₱' + resort.dayRate : 'Not available');
      console.log('Night Rate:', resort.hasNightRate ? '₱' + resort.nightRate : 'Not available');
      console.log('GCash:', resort.gcashNumber);
      console.log('Down Payment:', resort.downPaymentPercentage + '%');
      
      console.log('\n=== Cottage Details ===');
      resort.cottages?.forEach((cottage, i) => {
        const index = i + 1;
        console.log(`${index}. ${cottage.name} - ₱${cottage.dayRate}/₱${cottage.nightRate} (Max: ${cottage.maxOccupancy} pax)`);
      });
      
      console.log('\n=== Room Details ===');
      resort.rooms?.forEach((room, i) => {
        const index = i + 1;
        console.log(`${index}. ${room.name} - ₱${room.pricePerNight} (Max: ${room.maxOccupancy} pax)`);
      });
      
      console.log('\n=== Package Deals ===');
      resort.packages?.forEach((pkg, i) => {
        const index = i + 1;
        console.log(`${index}. ${pkg.name} - ₱${pkg.price}`);
      });

      console.log('\n=== Discount Codes ===');
      if (resort.discounts?.customDiscounts) {
        resort.discounts.customDiscounts.forEach((discount, i) => {
          const index = i + 1;
          console.log(`${index}. ${discount.name} - ${discount.percentage}% (Code: ${discount.promoCode})`);
        });
      }

      console.log('\n✅ Resort successfully verified and ready for bookings!');
      
    } else {
      console.log('❌ Resort not found!');
    }
    
  } catch (error) {
    console.error('Error verifying resort:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyMcJornResort();
