import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function addHorizonBeach() {
  try {
    console.log('🔄 Starting to add Horizon Beach resort...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Using database: ${db.databaseName}`);
    
    // Find Bien Wadingan's user ID
    const bienUser = await db.collection('users').findOne({ email: 'biennickwadingan@gmail.com' });
    
    if (!bienUser) {
      console.error('❌ User biennickwadingan@gmail.com not found in database');
      process.exit(1);
    }
    
    const userId = bienUser._id.toString();
    console.log(`👤 Found user ID: ${userId} for Bien Wadingan`);
    
    // Define Horizon Beach resort
    const horizonBeachResort = {
      userId: userId,
      name: "Horizon Beach",
      city: "Glan",
      country: "Philippines",
      description: "Horizon Beach offers a perfect tropical getaway with stunning ocean views and pristine white sand beaches. Experience world-class amenities, delicious cuisine, and warm Filipino hospitality for an unforgettable vacation experience.",
      type: ["Beachfront Resort", "Family Resort", "Luxury Resort"],
      facilities: ["Swimming Pool", "Beach Access", "Restaurant", "Bar", "WiFi", "Parking", "24/7 Reception", "Spa", "Kids Club"],
      dayRate: 600,
      nightRate: 2000,
      hasDayRate: true,
      hasNightRate: true,
      dayRateCheckInTime: "08:00 AM",
      dayRateCheckOutTime: "05:00 PM",
      nightRateCheckInTime: "02:00 PM",
      nightRateCheckOutTime: "12:00 PM",
      starRating: 5,
      imageUrls: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"],
      lastUpdated: new Date(),
      contact: {
        phone: "09123456789",
        email: "horizonbeach@example.com",
        website: "https://horizonbeach.com",
        facebook: "horizonbeachresort",
        instagram: "@horizonbeach",
        tiktok: "@horizonbeachph"
      },
      policies: {
        checkInTime: "02:00 PM",
        checkOutTime: "12:00 PM",
        dayCheckInTime: "08:00 AM",
        dayCheckOutTime: "05:00 PM",
        nightCheckInTime: "02:00 PM",
        nightCheckOutTime: "12:00 PM",
        resortPolicies: [
          {
            id: "policy_1",
            title: "No Pets Allowed",
            description: "For the comfort and safety of all guests, pets are not allowed on the resort premises.",
            isConfirmed: true
          },
          {
            id: "policy_2",
            title: "Quiet Hours",
            description: "Please observe quiet hours from 10:00 PM to 7:00 AM.",
            isConfirmed: true
          },
          {
            id: "policy_3",
            title: "Beach Conservation",
            description: "Help us protect our beautiful beach by not littering and respecting marine life.",
            isConfirmed: true
          }
        ]
      },
      amenities: [
        {
          id: "amenity_1",
          name: "Island Hopping",
          price: 2000,
          description: "Explore nearby islands with our guided boat tours",
          imageUrl: ""
        },
        {
          id: "amenity_2",
          name: "Snorkeling Gear Rental",
          price: 500,
          description: "Full snorkeling gear rental for the day",
          imageUrl: ""
        },
        {
          id: "amenity_3",
          name: "Spa Treatment",
          price: 2500,
          description: "Full body massage and spa treatment package",
          imageUrl: ""
        }
      ],
      rooms: [
        {
          id: "room_1",
          name: "Ocean View Suite",
          type: "Suite",
          pricePerNight: 4500,
          minOccupancy: 2,
          maxOccupancy: 4,
          description: "Spacious suite with panoramic ocean views and private balcony",
          amenities: ["King Bed", "Living Area", "Mini Bar", "WiFi", "Smart TV", "Jacuzzi"],
          imageUrl: "",
          units: 4
        },
        {
          id: "room_2",
          name: "Deluxe Room",
          type: "Deluxe",
          pricePerNight: 2800,
          minOccupancy: 2,
          maxOccupancy: 3,
          description: "Elegant room with modern amenities and ocean views",
          amenities: ["Queen Bed", "Mini Bar", "WiFi", "Smart TV", "Coffee Maker"],
          imageUrl: "",
          units: 6
        }
      ],
      cottages: [
        {
          id: "cottage_1",
          name: "Beachfront Cottage",
          type: "Standard",
          pricePerNight: 2000,
          dayRate: 1000,
          nightRate: 2000,
          hasDayRate: true,
          hasNightRate: true,
          minOccupancy: 2,
          maxOccupancy: 4,
          description: "Beautiful cottage right on the beach with stunning ocean views",
          amenities: ["Air Conditioning", "WiFi", "Mini Bar", "Private Deck"],
          imageUrl: ""
        },
        {
          id: "cottage_2",
          name: "Family Villa",
          type: "Luxury",
          pricePerNight: 3500,
          dayRate: 1500,
          nightRate: 3500,
          hasDayRate: true,
          hasNightRate: true,
          minOccupancy: 4,
          maxOccupancy: 8,
          description: "Spacious family villa with full kitchen and living area",
          amenities: ["Full Kitchen", "Living Room", "WiFi", "BBQ Grill", "Private Deck"],
          imageUrl: ""
        }
      ],
      packages: [],
      isFeatured: true,
      discounts: {
        seniorCitizenEnabled: true,
        seniorCitizenPercentage: 20,
        pwdEnabled: true,
        pwdPercentage: 20
      },
      adultEntranceFee: {
        dayRate: 100,
        nightRate: 200,
        pricingModel: "per_head",
        groupQuantity: 1
      },
      childEntranceFee: [
        {
          id: "child_1",
          minAge: 3,
          maxAge: 12,
          dayRate: 50,
          nightRate: 100,
          pricingModel: "per_head",
          groupQuantity: 1,
          isConfirmed: true
        }
      ],
      downPaymentPercentage: 50,
      gcashNumber: "09123456789",
      isApproved: true,
      status: "approved",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log(`🏨 Adding Horizon Beach resort...`);
    
    // Insert the resort
    const result = await db.collection('hotels').insertOne(horizonBeachResort);
    console.log(`✅ Successfully added Horizon Beach with ID: ${result.insertedId}`);
    
    console.log('\n🎉 Horizon Beach resort added successfully!');
    console.log('\n📊 Resort Details:');
    console.log(`   🏨 Name: ${horizonBeachResort.name}`);
    console.log(`   📍 ${horizonBeachResort.city}, ${horizonBeachResort.country}`);
    console.log(`   👤 Managed by: Bien Wadingan (${bienUser.email})`);
    console.log(`   💰 Day Rate: ₱${horizonBeachResort.dayRate} | Night Rate: ₱${horizonBeachResort.nightRate}`);
    console.log(`   ⭐ Rating: ${horizonBeachResort.starRating} stars`);
    console.log(`   ✅ Status: ${horizonBeachResort.isApproved ? 'Approved' : 'Pending'}`);
    console.log(`   🏠 Rooms: ${horizonBeachResort.rooms.length} | Cottages: ${horizonBeachResort.cottages.length}`);
    
  } catch (error) {
    console.error('❌ Failed to add Horizon Beach resort:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  addHorizonBeach();
}

export default addHorizonBeach;
