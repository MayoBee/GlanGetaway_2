import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';

async function addTempResorts() {
  try {
    console.log('🔄 Starting to add temporary resorts...');
    
    await mongoose.connect(MONGODB_CONNECTION_STRING);
    console.log('✅ Connected to MongoDB successfully');
    
    const db = mongoose.connection.db;
    console.log(`📦 Using database: ${db.databaseName}`);
    
    // Get the admin user ID (or use a default)
    const adminUser = await db.collection('users').findOne({ email: 'admin@glangetaway.com' });
    const userId = adminUser?._id?.toString() || 'admin_user_id';
    
    console.log(`👤 Using user ID: ${userId}`);
    
    // Define the temporary resorts
    const tempResorts = [
      {
        userId: userId,
        name: "Insta Glan",
        city: "Glan",
        country: "Philippines",
        description: "Experience the perfect getaway at Insta Glan, a stunning beachfront resort offering breathtaking views and world-class amenities. Perfect for families, couples, and solo travelers seeking relaxation and adventure.",
        type: ["Ocean View Resort", "Family Resort", "Beachfront Resort"],
        facilities: ["Swimming Pool", "Beach Access", "Restaurant", "Bar", "WiFi", "Parking", "24/7 Reception", "Spa"],
        dayRate: 500,
        nightRate: 1500,
        hasDayRate: true,
        hasNightRate: true,
        dayRateCheckInTime: "08:00 AM",
        dayRateCheckOutTime: "05:00 PM",
        nightRateCheckInTime: "02:00 PM",
        nightRateCheckOutTime: "12:00 PM",
        starRating: 5,
        imageUrls: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"],
        lastUpdated: new Date(),
        contact: {
          phone: "09123456789",
          email: "instaglan@example.com",
          website: "https://instaglan.com",
          facebook: "instaglanresort",
          instagram: "@instaglan",
          tiktok: "@instaglanresort"
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
          }
        ],
        rooms: [],
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
            amenities: ["Air Conditioning", "WiFi", "Mini Bar"],
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
      },
      {
        userId: userId,
        name: "Mc Jorn Shoreline Beach Resort",
        city: "Glan",
        country: "Philippines",
        description: "Mc Jorn Shoreline Beach Resort offers a perfect blend of relaxation and adventure. Enjoy our pristine shoreline, excellent dining options, and comfortable accommodations for an unforgettable vacation.",
        type: ["Beachfront Resort", "Family Resort", "Budget-Friendly"],
        facilities: ["Beach Access", "Restaurant", "Bar", "WiFi", "Parking", "BBQ Area", "Kids Playground"],
        dayRate: 300,
        nightRate: 1000,
        hasDayRate: true,
        hasNightRate: true,
        dayRateCheckInTime: "08:00 AM",
        dayRateCheckOutTime: "05:00 PM",
        nightRateCheckInTime: "01:00 PM",
        nightRateCheckOutTime: "11:00 AM",
        starRating: 4,
        imageUrls: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"],
        lastUpdated: new Date(),
        contact: {
          phone: "09234567890",
          email: "mcjorn@example.com",
          website: "https://mcjornresort.com",
          facebook: "mcjornshoreline",
          instagram: "@mcjornresort",
          tiktok: "@mcjornbeach"
        },
        policies: {
          checkInTime: "01:00 PM",
          checkOutTime: "11:00 AM",
          dayCheckInTime: "08:00 AM",
          dayCheckOutTime: "05:00 PM",
          nightCheckInTime: "01:00 PM",
          nightCheckOutTime: "11:00 AM",
          resortPolicies: [
            {
              id: "policy_1",
              title: "No Smoking in Rooms",
              description: "Smoking is not allowed inside the rooms. Designated smoking areas available.",
              isConfirmed: true
            }
          ]
        },
        amenities: [
          {
            id: "amenity_1",
            name: "Kayak Rental",
            price: 800,
            description: "Rent kayaks and explore the coastline at your own pace",
            imageUrl: ""
          },
          {
            id: "amenity_2",
            name: "Beach Volleyball",
            price: 200,
            description: "Enjoy beach volleyball with friends and family",
            imageUrl: ""
          }
        ],
        rooms: [
          {
            id: "room_1",
            name: "Standard Room",
            type: "Standard",
            pricePerNight: 1200,
            minOccupancy: 2,
            maxOccupancy: 3,
            description: "Comfortable standard room with essential amenities",
            amenities: ["Air Conditioning", "TV", "WiFi"],
            imageUrl: "",
            units: 5
          }
        ],
        cottages: [],
        packages: [],
        isFeatured: true,
        discounts: {
          seniorCitizenEnabled: true,
          seniorCitizenPercentage: 15,
          pwdEnabled: true,
          pwdPercentage: 15
        },
        adultEntranceFee: {
          dayRate: 75,
          nightRate: 150,
          pricingModel: "per_head",
          groupQuantity: 1
        },
        childEntranceFee: [
          {
            id: "child_1",
            minAge: 4,
            maxAge: 10,
            dayRate: 40,
            nightRate: 80,
            pricingModel: "per_head",
            groupQuantity: 1,
            isConfirmed: true
          }
        ],
        downPaymentPercentage: 30,
        gcashNumber: "09234567890",
        isApproved: true,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userId,
        name: "Kamari",
        city: "Glan",
        country: "Philippines",
        description: "Kamari is an exclusive beach resort offering luxury accommodations and personalized service. Experience the ultimate in relaxation with our private beach, gourmet dining, and world-class spa facilities.",
        type: ["Luxury Resort", "Adults Only", "Spa Resort"],
        facilities: ["Private Beach", "Infinity Pool", "Spa", "Fine Dining Restaurant", "Bar", "WiFi", "Concierge", "Room Service"],
        dayRate: 800,
        nightRate: 3000,
        hasDayRate: true,
        hasNightRate: true,
        dayRateCheckInTime: "09:00 AM",
        dayRateCheckOutTime: "06:00 PM",
        nightRateCheckInTime: "03:00 PM",
        nightRateCheckOutTime: "11:00 AM",
        starRating: 5,
        imageUrls: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800"],
        lastUpdated: new Date(),
        contact: {
          phone: "09345678901",
          email: "kamari@example.com",
          website: "https://kamariresort.com",
          facebook: "kamariluxury",
          instagram: "@kamariresort",
          tiktok: "@kamariluxury"
        },
        policies: {
          checkInTime: "03:00 PM",
          checkOutTime: "11:00 AM",
          dayCheckInTime: "09:00 AM",
          dayCheckOutTime: "06:00 PM",
          nightCheckInTime: "03:00 PM",
          nightCheckOutTime: "11:00 AM",
          resortPolicies: [
            {
              id: "policy_1",
              title: "Adults Only",
              description: "This resort is exclusively for adults 18 years and older.",
              isConfirmed: true
            },
            {
              id: "policy_2",
              title: "Dress Code",
              description: "Smart casual attire is required in dining areas after 6:00 PM.",
              isConfirmed: true
            }
          ]
        },
        amenities: [
          {
            id: "amenity_1",
            name: "Spa Treatment",
            price: 2500,
            description: "Full body massage and spa treatment package",
            imageUrl: ""
          },
          {
            id: "amenity_2",
            name: "Private Dinner",
            price: 5000,
            description: "Romantic private dinner on the beach with personal chef",
            imageUrl: ""
          }
        ],
        rooms: [
          {
            id: "room_1",
            name: "Ocean Suite",
            type: "Suite",
            pricePerNight: 5000,
            minOccupancy: 2,
            maxOccupancy: 2,
            description: "Luxurious suite with panoramic ocean views and private balcony",
            amenities: ["King Bed", "Jacuzzi", "Mini Bar", "WiFi", "Smart TV", "Room Service"],
            imageUrl: "",
            units: 3
          },
          {
            id: "room_2",
            name: "Deluxe Room",
            type: "Deluxe",
            pricePerNight: 3500,
            minOccupancy: 2,
            maxOccupancy: 2,
            description: "Elegant deluxe room with premium amenities",
            amenities: ["Queen Bed", "Mini Bar", "WiFi", "Smart TV"],
            imageUrl: "",
            units: 5
          }
        ],
        cottages: [],
        packages: [],
        isFeatured: true,
        discounts: {
          seniorCitizenEnabled: true,
          seniorCitizenPercentage: 10,
          pwdEnabled: true,
          pwdPercentage: 10
        },
        adultEntranceFee: {
          dayRate: 200,
          nightRate: 500,
          pricingModel: "per_head",
          groupQuantity: 1
        },
        childEntranceFee: [],
        downPaymentPercentage: 50,
        gcashNumber: "09345678901",
        isApproved: true,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userId,
        name: "Phil Rose",
        city: "Glan",
        country: "Philippines",
        description: "Phil Rose is a charming beach resort known for its warm hospitality and beautiful gardens. Enjoy our cozy accommodations, delicious local cuisine, and stunning sunset views over the ocean.",
        type: ["Garden Resort", "Family Resort", "Eco-Friendly"],
        facilities: ["Garden Views", "Restaurant", "Bar", "WiFi", "Parking", "Garden Tours", "Library"],
        dayRate: 400,
        nightRate: 1200,
        hasDayRate: true,
        hasNightRate: true,
        dayRateCheckInTime: "08:00 AM",
        dayRateCheckOutTime: "05:00 PM",
        nightRateCheckInTime: "01:00 PM",
        nightRateCheckOutTime: "11:00 AM",
        starRating: 4,
        imageUrls: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800"],
        lastUpdated: new Date(),
        contact: {
          phone: "09456789012",
          email: "philrose@example.com",
          website: "https://philroseresort.com",
          facebook: "philrosegarden",
          instagram: "@philroseresort",
          tiktok: "@philrosegarden"
        },
        policies: {
          checkInTime: "01:00 PM",
          checkOutTime: "11:00 AM",
          dayCheckInTime: "08:00 AM",
          dayCheckOutTime: "05:00 PM",
          nightCheckInTime: "01:00 PM",
          nightCheckOutTime: "11:00 AM",
          resortPolicies: [
            {
              id: "policy_1",
              title: "Eco-Friendly Policy",
              description: "We practice sustainable tourism. Please help us reduce waste and conserve energy.",
              isConfirmed: true
            },
            {
              id: "policy_2",
              title: "Garden Respect",
              description: "Please respect our beautiful gardens and do not pick flowers or plants.",
              isConfirmed: true
            }
          ]
        },
        amenities: [
          {
            id: "amenity_1",
            name: "Garden Tour",
            price: 300,
            description: "Guided tour of our beautiful tropical gardens",
            imageUrl: ""
          },
          {
            id: "amenity_2",
            name: "Cooking Class",
            price: 1500,
            description: "Learn to cook local Filipino dishes with our chef",
            imageUrl: ""
          }
        ],
        rooms: [
          {
            id: "room_1",
            name: "Garden View Room",
            type: "Standard",
            pricePerNight: 1500,
            minOccupancy: 2,
            maxOccupancy: 3,
            description: "Comfortable room with beautiful garden views",
            amenities: ["Air Conditioning", "WiFi", "Tea/Coffee Maker"],
            imageUrl: "",
            units: 4
          }
        ],
        cottages: [
          {
            id: "cottage_1",
            name: "Rose Cottage",
            type: "Standard",
            pricePerNight: 1800,
            dayRate: 800,
            nightRate: 1800,
            hasDayRate: true,
            hasNightRate: true,
            minOccupancy: 2,
            maxOccupancy: 4,
            description: "Charming cottage surrounded by rose gardens",
            amenities: ["Air Conditioning", "WiFi", "Private Patio"],
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
          dayRate: 80,
          nightRate: 160,
          pricingModel: "per_head",
          groupQuantity: 1
        },
        childEntranceFee: [
          {
            id: "child_1",
            minAge: 5,
            maxAge: 12,
            dayRate: 40,
            nightRate: 80,
            pricingModel: "per_head",
            groupQuantity: 1,
            isConfirmed: true
          }
        ],
        downPaymentPercentage: 40,
        gcashNumber: "09456789012",
        isApproved: true,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userId,
        name: "Belmar",
        city: "Glan",
        country: "Philippines",
        description: "Belmar is a premier beachfront resort offering stunning ocean views and exceptional service. Enjoy our pristine beach, elegant accommodations, and world-class amenities for a perfect tropical getaway.",
        type: ["Beachfront Resort", "Luxury Resort", "Family Resort"],
        facilities: ["Private Beach", "Swimming Pool", "Restaurant", "Bar", "WiFi", "Spa", "Fitness Center", "Kids Club"],
        dayRate: 600,
        nightRate: 2000,
        hasDayRate: true,
        hasNightRate: true,
        dayRateCheckInTime: "08:00 AM",
        dayRateCheckOutTime: "05:00 PM",
        nightRateCheckInTime: "02:00 PM",
        nightRateCheckOutTime: "12:00 PM",
        starRating: 5,
        imageUrls: ["https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800"],
        lastUpdated: new Date(),
        contact: {
          phone: "09567890123",
          email: "belmar@example.com",
          website: "https://belmarresort.com",
          facebook: "belmarbeach",
          instagram: "@belmarresort",
          tiktok: "@belmarluxury"
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
              title: "Beach Conservation",
              description: "Help us protect our beautiful beach by not littering and respecting marine life.",
              isConfirmed: true
            },
            {
              id: "policy_2",
              title: "Pool Rules",
              description: "Children under 12 must be accompanied by an adult in the pool area.",
              isConfirmed: true
            }
          ]
        },
        amenities: [
          {
            id: "amenity_1",
            name: "Jet Ski Rental",
            price: 2500,
            description: "High-speed jet ski rental for 30 minutes",
            imageUrl: ""
          },
          {
            id: "amenity_2",
            name: "Parasailing",
            price: 3000,
            description: "Experience breathtaking views while parasailing over the ocean",
            imageUrl: ""
          },
          {
            id: "amenity_3",
            name: "Spa Package",
            price: 4000,
            description: "Full day spa package with massage and treatments",
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
            name: "Beach Villa",
            type: "Luxury",
            pricePerNight: 3500,
            dayRate: 1500,
            nightRate: 3500,
            hasDayRate: true,
            hasNightRate: true,
            minOccupancy: 2,
            maxOccupancy: 6,
            description: "Luxury beachfront villa with private deck and direct beach access",
            amenities: ["Full Kitchen", "Living Room", "WiFi", "BBQ Grill", "Private Deck"],
            imageUrl: ""
          }
        ],
        packages: [],
        isFeatured: true,
        discounts: {
          seniorCitizenEnabled: true,
          seniorCitizenPercentage: 15,
          pwdEnabled: true,
          pwdPercentage: 15
        },
        adultEntranceFee: {
          dayRate: 120,
          nightRate: 250,
          pricingModel: "per_head",
          groupQuantity: 1
        },
        childEntranceFee: [
          {
            id: "child_1",
            minAge: 4,
            maxAge: 12,
            dayRate: 60,
            nightRate: 125,
            pricingModel: "per_head",
            groupQuantity: 1,
            isConfirmed: true
          }
        ],
        downPaymentPercentage: 50,
        gcashNumber: "09567890123",
        isApproved: true,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userId,
        name: "Jap Beach",
        city: "Glan",
        country: "Philippines",
        description: "Jap Beach is a hidden gem offering a tranquil escape from the everyday. Experience pristine white sand beaches, crystal clear waters, and authentic Filipino hospitality at its finest.",
        type: ["Beachfront Resort", "Budget-Friendly", "Eco-Tourism"],
        facilities: ["White Sand Beach", "Restaurant", "Bar", "WiFi", "Parking", "Hiking Trails", "Snorkeling Area"],
        dayRate: 250,
        nightRate: 800,
        hasDayRate: true,
        hasNightRate: true,
        dayRateCheckInTime: "07:00 AM",
        dayRateCheckOutTime: "06:00 PM",
        nightRateCheckInTime: "01:00 PM",
        nightRateCheckOutTime: "11:00 AM",
        starRating: 4,
        imageUrls: ["https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800"],
        lastUpdated: new Date(),
        contact: {
          phone: "09678901234",
          email: "japbeach@example.com",
          website: "https://japbeach.com",
          facebook: "japbeachresort",
          instagram: "@japbeach",
          tiktok: "@japbeachph"
        },
        policies: {
          checkInTime: "01:00 PM",
          checkOutTime: "11:00 AM",
          dayCheckInTime: "07:00 AM",
          dayCheckOutTime: "06:00 PM",
          nightCheckInTime: "01:00 PM",
          nightCheckOutTime: "11:00 AM",
          resortPolicies: [
            {
              id: "policy_1",
              title: "Eco-Tourism",
              description: "We are committed to sustainable tourism. Please help us preserve nature.",
              isConfirmed: true
            },
            {
              id: "policy_2",
              title: "Quiet Beach",
              description: "Please maintain a peaceful atmosphere for all guests to enjoy.",
              isConfirmed: true
            }
          ]
        },
        amenities: [
          {
            id: "amenity_1",
            name: "Snorkeling Tour",
            price: 600,
            description: "Guided snorkeling tour to nearby coral reefs",
            imageUrl: ""
          },
          {
            id: "amenity_2",
            name: "Hiking Adventure",
            price: 400,
            description: "Guided nature hike to scenic viewpoints",
            imageUrl: ""
          },
          {
            id: "amenity_3",
            name: "Beach Camping",
            price: 500,
            description: "Overnight beach camping experience with basic amenities",
            imageUrl: ""
          }
        ],
        rooms: [
          {
            id: "room_1",
            name: "Beach Hut",
            type: "Standard",
            pricePerNight: 1000,
            minOccupancy: 2,
            maxOccupancy: 3,
            description: "Traditional Filipino beach hut with basic comforts",
            amenities: ["Fan", "WiFi", "Mosquito Net"],
            imageUrl: "",
            units: 8
          },
          {
            id: "room_2",
            name: "Garden Room",
            type: "Standard",
            pricePerNight: 1200,
            minOccupancy: 2,
            maxOccupancy: 3,
            description: "Cozy room surrounded by tropical gardens",
            amenities: ["Air Conditioning", "WiFi", "Private Bathroom"],
            imageUrl: "",
            units: 5
          }
        ],
        cottages: [
          {
            id: "cottage_1",
            name: "Family Cottage",
            type: "Standard",
            pricePerNight: 1500,
            dayRate: 600,
            nightRate: 1500,
            hasDayRate: true,
            hasNightRate: true,
            minOccupancy: 4,
            maxOccupancy: 8,
            description: "Spacious family cottage perfect for groups",
            amenities: ["Kitchen", "Living Area", "WiFi", "BBQ Area"],
            imageUrl: ""
          }
        ],
        packages: [],
        isFeatured: true,
        discounts: {
          seniorCitizenEnabled: true,
          seniorCitizenPercentage: 25,
          pwdEnabled: true,
          pwdPercentage: 25
        },
        adultEntranceFee: {
          dayRate: 50,
          nightRate: 100,
          pricingModel: "per_head",
          groupQuantity: 1
        },
        childEntranceFee: [
          {
            id: "child_1",
            minAge: 3,
            maxAge: 12,
            dayRate: 25,
            nightRate: 50,
            pricingModel: "per_head",
            groupQuantity: 1,
            isConfirmed: true
          }
        ],
        downPaymentPercentage: 30,
        gcashNumber: "09678901234",
        isApproved: true,
        status: "approved",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    console.log(`🏨 Adding ${tempResorts.length} temporary resorts...`);
    
    // Insert the resorts
    const result = await db.collection('hotels').insertMany(tempResorts);
    console.log(`✅ Successfully added ${result.insertedCount} resorts`);
    
    console.log('\n🎉 Temporary resorts added successfully!');
    console.log('\n📊 Resorts Added:');
    tempResorts.forEach((resort, index) => {
      console.log(`${index + 1}. ${resort.name}`);
      console.log(`   📍 ${resort.city}, ${resort.country}`);
      console.log(`   💰 Day Rate: ₱${resort.dayRate} | Night Rate: ₱${resort.nightRate}`);
      console.log(`   ⭐ Rating: ${resort.starRating} stars`);
      console.log(`   ✅ Status: ${resort.isApproved ? 'Approved' : 'Pending'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to add temporary resorts:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  addTempResorts();
}

export default addTempResorts;
