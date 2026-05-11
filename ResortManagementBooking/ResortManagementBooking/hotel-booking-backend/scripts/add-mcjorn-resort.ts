import mongoose from 'mongoose';
import Hotel from '../src/models/hotel';
import User from '../src/models/user';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addMcJornResort() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/hotel-booking';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find or create manager user (Mayobi Wadz)
    let managerUser = await User.findOne({ email: 'biennickwadingan@gmail.com' });
    
    if (!managerUser) {
      // Create manager user if doesn't exist
      managerUser = new User({
        firstName: 'Mayobi',
        lastName: 'Wadz',
        email: 'biennickwadingan@gmail.com',
        password: '$2b$10$example_hashed_password_here', // This should be properly hashed
        role: 'resort_owner',
        isActive: true,
        totalBookings: 0,
        mustChangePassword: true, // Force password change on first login
      });
      await managerUser.save();
      console.log('Created manager user for Mayobi Wadz');
    }

    // McJorn Beach Resort data structure
    const mcjornResortData = {
      userId: managerUser._id,
      name: 'McJorn Shoreline Beach Resort',
      city: 'Tulan',
      country: 'Glan, Sarangani Province',
      description: 'Beachfront resort offering day tours and overnight stays with various accommodations including open cottages, A-house rooms, and exclusive packages. Perfect for families and groups looking for a relaxing beach experience.',
      type: ['Beach Resort', 'Beachfront Resort', 'Family Resort', 'Pet Friendly Resort'],
      facilities: ['Free WiFi', 'Parking', 'Family Rooms', 'Beachfront', 'Water Sports'],
      dayRate: 100,
      nightRate: 100,
      hasDayRate: true,
      hasNightRate: true,
      dayRateCheckInTime: '01:00 PM',
      dayRateCheckOutTime: '11:00 AM',
      nightRateCheckInTime: '02:00 PM',
      nightRateCheckOutTime: '11:00 AM',
      starRating: 3,
      imageUrls: [
        'https://picsum.photos/seed/mcjorn-beach-1/800/600.jpg',
        'https://picsum.photos/seed/mcjorn-beach-2/800/600.jpg',
        'https://picsum.photos/seed/mcjorn-beach-3/800/600.jpg'
      ],
      lastUpdated: new Date(),
      
      // Contact information
      contact: {
        phone: '09357037450',
        email: 'biennickwadingan@gmail.com',
        website: '',
        facebook: 'Mc Jorn Aqua Sports & Others',
        instagram: '',
        tiktok: ''
      },

      // Policies
      policies: {
        checkInTime: '01:00 PM',
        checkOutTime: '11:00 AM',
        dayCheckInTime: '01:00 PM',
        dayCheckOutTime: '11:00 AM',
        nightCheckInTime: '02:00 PM',
        nightCheckOutTime: '11:00 AM',
        resortPolicies: [
          {
            id: 'pet-friendly',
            title: 'Pet Friendly',
            description: 'Pets are allowed but please be a responsible pet owner',
            isConfirmed: true
          },
          {
            id: 'no-cancellation',
            title: 'No Cancellation Policy',
            description: 'Bookings are non-refundable. No cancellation allowed.',
            isConfirmed: true
          },
          {
            id: 'rescheduling',
            title: 'One-Time Rescheduling',
            description: 'One time rescheduling of bookings should be made two (2) days prior to the date of reservation',
            isConfirmed: true
          },
          {
            id: 'id-required',
            title: 'Valid ID Required',
            description: 'Guests must present a valid ID for verification during check-in',
            isConfirmed: true
          },
          {
            id: 'quiet-hours',
            title: 'Quiet Hours',
            description: 'Observance of quiet hours from 10PM to 5AM',
            isConfirmed: true
          },
          {
            id: 'lgu-fee',
            title: 'LGU Environmental Fee',
            description: 'In compliance with the Tourism Ecological Fee Ordinance of the Municipality of Glan, Guests must present the Official Receipt issued by LGU Glan to the Front Desk during check-in',
            isConfirmed: true
          },
          {
            id: 'generator-policy',
            title: 'Generator Policy',
            description: 'Generator will be utilized from 6PM to 5AM only in case of brownout, subject to generator load capacity',
            isConfirmed: true
          },
          {
            id: 'kids-free',
            title: 'Children Free Entrance',
            description: '5 years below free entrance fee',
            isConfirmed: true
          }
        ]
      },

      // Open Cottages (4 units, good for 10 pax)
      cottages: [
        {
          id: 'bening-cottage',
          name: 'Bening Cottage',
          type: 'Open Cottage',
          pricePerNight: 1000,
          dayRate: 1000,
          nightRate: 1000,
          hasDayRate: true,
          hasNightRate: true,
          minOccupancy: 1,
          maxOccupancy: 10,
          description: 'Spacious open cottage perfect for families and groups, good for up to 10 persons',
          amenities: ['Free entrance for 6 pax', 'Excess pax ₱50 each'],
          units: 1
        },
        {
          id: 'casio-cottage',
          name: 'Casio Cottage',
          type: 'Open Cottage',
          pricePerNight: 1000,
          dayRate: 1000,
          nightRate: 1000,
          hasDayRate: true,
          hasNightRate: true,
          minOccupancy: 1,
          maxOccupancy: 10,
          description: 'Comfortable open cottage ideal for group gatherings and beach activities',
          amenities: ['Free entrance for 6 pax', 'Excess pax ₱50 each'],
          units: 1
        },
        {
          id: 'layad-cottage',
          name: 'Layad Cottage',
          type: 'Open Cottage',
          pricePerNight: 1000,
          dayRate: 1000,
          nightRate: 1000,
          hasDayRate: true,
          hasNightRate: true,
          minOccupancy: 1,
          maxOccupancy: 10,
          description: 'Beachfront cottage offering shade and comfort for day tours or overnight stays',
          amenities: ['Free entrance for 6 pax', 'Excess pax ₱50 each'],
          units: 1
        },
        {
          id: 'talaw-cottage',
          name: 'Talaw Cottage',
          type: 'Open Cottage',
          pricePerNight: 1000,
          dayRate: 1000,
          nightRate: 1000,
          hasDayRate: true,
          hasNightRate: true,
          minOccupancy: 1,
          maxOccupancy: 10,
          description: 'Traditional open cottage with beach access, perfect for relaxation',
          amenities: ['Free entrance for 6 pax', 'Excess pax ₱50 each'],
          units: 1
        }
      ],

      // A-House Rooms (Non-aircon)
      rooms: [
        {
          id: 'leoncio-room',
          name: 'Leoncio Room',
          type: 'A-House (Non-aircon)',
          pricePerNight: 1500,
          minOccupancy: 1,
          maxOccupancy: 6,
          description: 'Comfortable non-airconditioned room good for 4-6 persons',
          amenities: ['Free entrance for 6 pax'],
          units: 1
        },
        {
          id: 'urbana-room',
          name: 'Urbana Room',
          type: 'A-House (Non-aircon)',
          pricePerNight: 1500,
          minOccupancy: 1,
          maxOccupancy: 6,
          description: 'Spacious non-airconditioned room perfect for families',
          amenities: ['Free entrance for 6 pax'],
          units: 1
        },
        {
          id: 'damalan-room',
          name: 'Damalan Room',
          type: 'A-House (Aircon)',
          pricePerNight: 2000,
          minOccupancy: 1,
          maxOccupancy: 6,
          description: 'Airconditioned room with modern amenities, good for 4-6 persons',
          amenities: ['Free entrance for 6 pax', 'Air conditioning'],
          units: 1
        },
        {
          id: 'pinang-room',
          name: 'Pinang Room',
          type: 'A-House (Aircon)',
          pricePerNight: 2000,
          minOccupancy: 1,
          maxOccupancy: 6,
          description: 'Premium airconditioned room with comfort and convenience',
          amenities: ['Free entrance for 6 pax', 'Air conditioning'],
          units: 1
        }
      ],

      // Amenities
      amenities: [
        {
          id: 'karaoke',
          name: 'Karaoke',
          price: 750,
          description: 'Karaoke machine for entertainment',
          units: 1
        },
        {
          id: 'kayak',
          name: 'Kayak',
          price: 500,
          description: 'Kayak rental for overnight use',
          units: 1
        },
        {
          id: 'single-floater',
          name: 'Single Floater',
          price: 500,
          description: 'Single floater for water or sand use (overnight)',
          units: 1
        },
        {
          id: 'sleeping-tent',
          name: 'Sleeping Tent',
          price: 500,
          description: 'Sleeping tent with complete beddings',
          units: 1
        }
      ],

      // Package Deals
      packages: [
        {
          id: 'barkada-dap-ayan',
          name: 'Barkada Offer (Dap-ayan)',
          description: 'Premium package for large groups with aircon room, function hall, and amenities',
          price: 10000,
          imageUrl: 'https://picsum.photos/seed/dap-ayan-package/800/600.jpg',
          includedCottages: [],
          includedRooms: ['damalan-room'],
          includedAmenities: ['karaoke'],
          includedAdultEntranceFee: true,
          includedChildEntranceFee: true,
          customItems: [
            {
              id: 'function-hall',
              name: 'Function Hall',
              description: 'Function hall with amenities including refrigerator, karaoke, water dispenser, super kalan'
            },
            {
              id: 'furniture-set',
              name: 'Furniture Set',
              description: '2 long table, sala set, 12 monoblock chairs'
            }
          ],
          customRooms: [],
          customCottages: [],
          customAmenities: []
        },
        {
          id: 'barkada-at-atoan',
          name: 'Barkada Offer (At-atoan)',
          description: 'Economy package for groups with complete beddings and basic amenities',
          price: 5000,
          imageUrl: 'https://picsum.photos/seed/at-atoan-package/800/600.jpg',
          includedCottages: [],
          includedRooms: [],
          includedAmenities: [],
          includedAdultEntranceFee: true,
          includedChildEntranceFee: true,
          customItems: [
            {
              id: 'bedding-sets',
              name: 'Complete Beddings',
              description: '4 sets of complete beddings bed capacity 8 to 12 pax'
            },
            {
              id: 'electric-fans',
              name: 'Electric Fans',
              description: '2 unit electric fan'
            },
            {
              id: 'queen-beds',
              name: 'Queen Size Beds',
              description: '2 unit of queen size bed with/out beddings (bed capacity 8pax)'
            },
            {
              id: 'table-chairs',
              name: 'Table and Chairs',
              description: '1 long table, 12 monoblock chairs'
            }
          ],
          customRooms: [],
          customCottages: [],
          customAmenities: []
        },
        {
          id: 'exclusive-150',
          name: 'Exclusive Resort (150+ pax)',
          description: 'Exclusive resort use for groups of more than 150 persons',
          price: 20000,
          imageUrl: 'https://picsum.photos/seed/exclusive-150/800/600.jpg',
          includedCottages: ['bening-cottage', 'casio-cottage', 'layad-cottage', 'talaw-cottage'],
          includedRooms: ['leoncio-room', 'urbana-room', 'damalan-room', 'pinang-room'],
          includedAmenities: ['karaoke', 'kayak', 'single-floater', 'sleeping-tent'],
          includedAdultEntranceFee: true,
          includedChildEntranceFee: true,
          customItems: [
            {
              id: 'exclusive-access',
              name: 'Exclusive Access',
              description: 'Full resort exclusivity for your event'
            }
          ],
          customRooms: [],
          customCottages: [],
          customAmenities: []
        },
        {
          id: 'exclusive-100',
          name: 'Exclusive Resort (100+ pax)',
          description: 'Exclusive resort use for groups of more than 100 persons',
          price: 18000,
          imageUrl: 'https://picsum.photos/seed/exclusive-100/800/600.jpg',
          includedCottages: ['bening-cottage', 'casio-cottage', 'layad-cottage', 'talaw-cottage'],
          includedRooms: ['leoncio-room', 'urbana-room', 'damalan-room', 'pinang-room'],
          includedAmenities: ['karaoke', 'kayak', 'single-floater', 'sleeping-tent'],
          includedAdultEntranceFee: true,
          includedChildEntranceFee: true,
          customItems: [
            {
              id: 'exclusive-access',
              name: 'Exclusive Access',
              description: 'Full resort exclusivity for your event'
            }
          ],
          customRooms: [],
          customCottages: [],
          customAmenities: []
        },
        {
          id: 'exclusive-50',
          name: 'Exclusive Resort (50+ pax)',
          description: 'Exclusive resort use for groups of more than 50 persons',
          price: 15000,
          imageUrl: 'https://picsum.photos/seed/exclusive-50/800/600.jpg',
          includedCottages: ['bening-cottage', 'casio-cottage', 'layad-cottage', 'talaw-cottage'],
          includedRooms: ['leoncio-room', 'urbana-room', 'damalan-room', 'pinang-room'],
          includedAmenities: ['karaoke', 'kayak', 'single-floater', 'sleeping-tent'],
          includedAdultEntranceFee: true,
          includedChildEntranceFee: true,
          customItems: [
            {
              id: 'exclusive-access',
              name: 'Exclusive Access',
              description: 'Full resort exclusivity for your event'
            }
          ],
          customRooms: [],
          customCottages: [],
          customAmenities: []
        }
      ],

      // Child entrance fee (5 years below free)
      childEntranceFee: [
        {
          id: 'children-free',
          minAge: 0,
          maxAge: 5,
          dayRate: 0,
          nightRate: 0,
          pricingModel: 'per_head' as const,
          groupQuantity: 1,
          isConfirmed: true
        }
      ],

      // Discount configuration
      discounts: {
        seniorCitizenEnabled: true,
        seniorCitizenPercentage: 20,
        pwdEnabled: true,
        pwdPercentage: 20,
        customDiscounts: [
          {
            id: 'gov-employee',
            name: 'Government Employees',
            percentage: 15,
            promoCode: 'GOV2025',
            isEnabled: true,
            maxUses: 1000,
            validUntil: new Date('2025-12-31')
          },
          {
            id: 'uniformed-personnel',
            name: 'Uniformed Personnel',
            percentage: 15,
            promoCode: 'UNIFORM2025',
            isEnabled: true,
            maxUses: 1000,
            validUntil: new Date('2025-12-31')
          },
          {
            id: 'eagles-club',
            name: 'Eagles Club',
            percentage: 10,
            promoCode: 'EAGLES2025',
            isEnabled: true,
            maxUses: 500,
            validUntil: new Date('2025-12-31')
          },
          {
            id: 'indigent-loyal',
            name: 'Indigent & Loyal Clients',
            percentage: 5,
            promoCode: 'LOYAL2025',
            isEnabled: true,
            maxUses: 200,
            validUntil: new Date('2025-12-31')
          }
        ]
      },

      // Payment configuration
      downPaymentPercentage: 50,
      gcashNumber: '09357037450',

      // Approval status (set to pending for admin approval)
      isApproved: false,
      status: 'pending',

      // Analytics defaults
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      reviewCount: 0,
      occupancyRate: 0,
      isActive: true,
      isFeatured: false
    };

    // Check if resort already exists
    const existingResort = await Hotel.findOne({ 
      name: mcjornResortData.name,
      userId: managerUser._id 
    });

    if (existingResort) {
      console.log('McJorn Beach Resort already exists. Updating...');
      await Hotel.findByIdAndUpdate(existingResort._id, mcjornResortData);
      console.log('McJorn Beach Resort updated successfully');
    } else {
      // Create new resort
      const resort = new Hotel(mcjornResortData);
      await resort.save();
      console.log('McJorn Beach Resort created successfully');
      console.log('Resort ID:', resort._id);
    }

    console.log('\n=== Resort Summary ===');
    console.log('Name:', mcjornResortData.name);
    console.log('Manager:', managerUser.email);
    console.log('Cottages:', mcjornResortData.cottages.length);
    console.log('Rooms:', mcjornResortData.rooms.length);
    console.log('Amenities:', mcjornResortData.amenities.length);
    console.log('Packages:', mcjornResortData.packages.length);
    console.log('Discounts:', mcjornResortData.discounts.customDiscounts.length);

  } catch (error) {
    console.error('Error adding McJorn Beach Resort:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addMcJornResort();
