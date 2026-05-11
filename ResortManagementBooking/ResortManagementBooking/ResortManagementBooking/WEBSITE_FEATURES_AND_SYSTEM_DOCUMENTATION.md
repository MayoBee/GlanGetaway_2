# Glan Getaway Resort Booking Platform - Complete Features & System Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Technical Architecture](#technical-architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Core Features](#core-features)
5. [Booking System](#booking-system)
6. [Payment System](#payment-system)
7. [Resort Management](#resort-management)
8. [Admin Features](#admin-features)
9. [Search & Discovery](#search--discovery)
10. [Analytics & Reporting](#analytics--reporting)
11. [Housekeeping & Maintenance](#housekeeping--maintenance)
12. [Business Rules & Policies](#business-rules--policies)
13. [Database Schema](#database-schema)
14. [API Endpoints](#api-endpoints)
15. [Frontend Architecture](#frontend-architecture)

---

## 🏗️ System Overview

### Platform Purpose
Glan Getaway is a comprehensive resort booking management system that connects travelers with beach resorts in the Philippines. The platform serves as an intermediary for booking accommodations while providing resort owners with tools to manage their properties, track bookings, and analyze business performance.

### Key Value Propositions
- **For Travelers**: Easy discovery of beach resorts, secure booking with down payments, transparent pricing
- **For Resort Owners**: Complete property management, booking tracking, revenue analytics, approval workflow
- **For Administrators**: User management, resort approval, system oversight, comprehensive reporting

### Business Model
- Commission-based on successful bookings
- Down payment system (configurable percentage, default 50%)
- Remaining balance paid directly at resort
- Platform acts as booking intermediary only

---

## 💻 Technical Architecture

### Technology Stack

#### Frontend
- **React 18.2.0** - UI library with hooks
- **TypeScript 5.0.2** - Type-safe development
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Modern component library
- **Lucide React** - Icon library
- **React Hook Form** - Form validation

#### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Cloudinary** - Cloud image storage
- **Stripe** - Payment processing (optional)
- **Swagger** - API documentation

#### Infrastructure
- **MongoDB Atlas** - Cloud database
- **Render** - Backend hosting
- **Vercel** - Frontend hosting
- **Cloudinary** - Image CDN

### Architecture Pattern
The backend follows **Domain-Driven Design (DDD)** with modular structure:

```
hotel-booking-backend/src/
├── domains/
│   ├── identity/       # User authentication & management
│   ├── hotel/          # Resort/resort management
│   ├── booking/        # Booking operations
│   ├── billing/        # Payment processing
│   └── admin/          # Admin operations
├── routes/             # API route handlers
├── middleware/         # Express middleware
├── models/             # Database models (legacy exports)
├── services/           # Business logic services
├── validations/        # Input validation schemas
└── types/              # TypeScript type definitions
```

### Frontend Structure
```
hotel-booking-frontend/src/
├── pages/              # Route components
├── components/         # Reusable UI components
├── forms/              # Form components
├── contexts/           # React contexts for state
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── utils/              # Utility functions
└── api-client.ts       # API client configuration
```

---

## 👥 User Roles & Permissions

### Three-Tier Account System

#### 1. Super Admin
**Default Credentials**: `superadmin@glangetaway.com` / `SuperAdmin123!`

**Permissions**:
- Full system access and control
- Approve/reject resort registrations
- Promote/demote users to admin roles
- Access all admin dashboards and reports
- Verify PWD IDs and user accounts
- Manage all system settings
- View all resorts, bookings, and users

**Access**: Dedicated admin portal at `/admin`

#### 2. Admin / Resort Owner / Front Desk
**Permissions**:
- Create and manage resort listings
- Manage rooms, cottages, and amenities
- View and manage bookings for their resorts
- Access resort-specific analytics and reports
- Set pricing (day/night rates)
- Configure entrance fees
- Manage GCash payment verification
- View housekeeping tasks (if front desk role)

**Restrictions**:
- Resorts require Super Admin approval before becoming visible
- Limited to their own resort data only
- Cannot access other resorts' information

**Access**: Main website with protected routes

#### 3. Regular User
**Permissions**:
- Search and view approved resorts
- Create bookings with down payments
- Manage own bookings
- Apply for resort owner role
- View booking history
- Access PWD/Senior Citizen discounts (with verification)

**Restrictions**:
- Cannot create or publish resorts
- Cannot access admin features
- Limited to viewing approved resorts only

### Staff Roles (Extended System)
The system supports additional staff roles for resort operations:

- **Front Desk**: Booking management, room management, billing, activities
- **Housekeeping**: Housekeeping tasks, maintenance
- **Maintenance**: Maintenance operations
- **Food & Beverage**: Restaurant/bar operations
- **Activities**: Activity and event management

### Permission System
Fine-grained permissions control access to specific features:
- `canManageBookings` - Booking operations
- `canManageRooms` - Room/cottage management
- `canManagePricing` - Pricing configuration
- `canManageAmenities` - Amenity management
- `canManageActivities` - Activity management
- `canViewReports` - Report access
- `canManageBilling` - Billing operations
- `canManageHousekeeping` - Housekeeping tasks
- `canManageMaintenance` - Maintenance operations
- `canManageUsers` - User management

---

## 🎯 Core Features

### 1. Resort Discovery & Search
- **Advanced Search**: Multi-criteria filtering (destination, dates, guests, price, rating)
- **Location-Based Search**: Geolocation support for nearby resorts
- **Smart Filtering**: Filter by facilities, hotel types, star ratings
- **Sorting Options**: Price, rating, distance, relevance
- **Pagination**: Efficient data loading for large datasets
- **Real-time Availability**: Live booking status checks

### 2. User Authentication
- **JWT Token Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permissions per role
- **Password Security**: bcrypt hashing with 12-round cost factor
- **Session Management**: Cookie-based token storage
- **Email Verification**: Optional email verification system
- **OAuth Integration**: Google OAuth support (prepared)

### 3. Account Verification
- **PWD Verification**: Super Admin verifies PWD IDs for discount eligibility
- **Account Verification**: Super Admin verifies user accounts
- **Verification Tracking**: Tracks who verified and when
- **Document Upload**: Upload verification documents

### 4. Image Management
- **Cloudinary Integration**: Cloud image storage and CDN
- **Multiple Image Upload**: Support for resort image galleries
- **Image Optimization**: Automatic image optimization
- **Smart Image Component**: Lazy loading and error handling

### 5. Discount System
- **Senior Citizen Discount**: 20% default (configurable per resort)
- **PWD Discount**: 20% default (configurable per resort)
- **Discount Eligibility**: Requires account verification
- **Per-Resort Configuration**: Each resort can enable/disable discounts
- **Removed Custom Discounts**: Promo codes and custom discounts removed per business rules

---

## 📅 Booking System

### Booking Flow

#### 1. Search & Selection
- User searches for resorts with filters
- Views resort details with day/night pricing
- Selects check-in/check-out dates
- Chooses rooms, cottages, and amenities

#### 2. Booking Configuration
- **Room Selection**: Choose from available rooms
- **Cottage Selection**: Choose from available cottages
- **Amenity Selection**: Add amenities (paid at resort)
- **Guest Count**: Specify adult and child counts
- **Discount Application**: Apply PWD/Senior Citizen discounts if eligible

#### 3. Guest Information
- Personal details (name, email, phone)
- Special requests
- Discount verification (if applicable)

#### 4. Payment Processing
- **Down Payment**: Configurable percentage (default 50%)
- **Payment Methods**: GCash (primary), Stripe (optional)
- **GCash Flow**:
  - User enters GCash number
  - Makes transfer to resort's GCash
  - Uploads screenshot with reference number
  - Resort owner verifies payment
  - Booking confirmed upon verification

#### 5. Booking Confirmation
- **8-Hour Modification Window**: Changes allowed within 8 hours
- **Auto-Confirmation**: Booking auto-confirms after 8 hours
- **Modification History**: Tracks all changes
- **Owner Verification**: Resort owner can verify bookings

### Booking Features

#### Pricing Structure
- **Day Rate**: For day-use bookings
- **Night Rate**: For overnight stays
- **Per-Resort Configuration**: Each resort sets own rates
- **Entrance Fees**: Separate adult and child entrance fees
- **Pricing Models**: Per-head or per-group options

#### Accommodation Types
- **Rooms**: Standard hotel rooms with per-night pricing
- **Cottages**: Beach cottages with day/night rate options
- **Packages**: Bundled offerings with multiple accommodations

#### Availability Management
- **Real-time Availability**: Checks existing bookings
- **Date Range Validation**: Prevents overlapping bookings
- **Room/Cottage Blocking**: Temporarily block availability
- **Occupancy Limits**: Enforces max occupancy per unit

#### Booking Statuses
- `pending` - Initial booking state
- `confirmed` - Payment verified and confirmed
- `cancelled` - Booking cancelled by user or resort
- `completed` - Stay completed
- `refunded` - Payment refunded

#### Payment Statuses
- `pending` - Payment awaiting verification
- `paid` - Payment verified and confirmed
- `failed` - Payment failed
- `refunded` - Payment refunded

### Booking Modification Policy
- **8-Hour Window**: Free modifications within 8 hours of booking
- **Post-Window Changes**: Require resort contact, may incur fees
- **Modification Types**:
  - Date rescheduling
  - Adding/removing rooms or cottages
  - Adding/removing amenities
  - Guest count changes
- **Modification History**: Complete audit trail of all changes

---

## 💳 Payment System

### Payment Methods

#### GCash (Primary)
- **Flow**:
  1. User sees resort's GCash number
  2. User transfers down payment amount
  3. User enters reference number and uploads screenshot
  4. Resort owner reviews and verifies payment
  5. Booking confirmed upon verification
- **Verification**: Manual verification by resort owner
- **Rejection**: Owner can reject with reason if payment invalid

#### Stripe (Optional)
- **Integration**: Stripe payment processing
- **Payment Intents**: Secure payment flow
- **Webhooks**: Payment status updates
- **Refunds**: Automated refund processing

### Payment Features

#### Down Payment System
- **Configurable Percentage**: Each resort sets down payment % (10-100%)
- **Default**: 50% down payment
- **Remaining Balance**: Paid at resort front desk
- **Deposit Tracking**: Tracks deposit amount and remaining balance

#### Payment Verification
- **Manual Verification**: For GCash payments
- **Screenshot Upload**: Proof of payment
- **Reference Number**: Transaction tracking
- **Verification Notes**: Owner can add notes
- **Verification History**: Tracks who verified and when

#### Refund System
- **Refund Amount Tracking**: Tracks refund amounts
- **Refund Method**: Records refund method
- **Refund Date**: Timestamp for refunds
- **Cancellation Reason**: Records why refund was issued

### Payment Security
- **Secure Token Storage**: Payment tokens stored securely
- **PCI Compliance**: Stripe integration is PCI-compliant
- **Audit Trail**: Complete payment transaction history
- **Role-Based Access**: Only authorized roles can verify payments

---

## 🏨 Resort Management

### Resort Creation & Editing

#### Basic Information
- Resort name, description
- Location (city, country)
- Contact information (phone, email, website)
- Social media links (Facebook, Instagram, TikTok)
- Star rating (1-5 stars)

#### Pricing Configuration
- **Day Rate**: For day-use bookings
- **Night Rate**: For overnight stays
- **Rate Availability**: Toggle day/night rate availability
- **Entrance Fees**:
  - Adult entrance fee (day/night rates)
  - Child entrance fee (age ranges, day/night rates)
  - Pricing model (per-head or per-group)
- **Down Payment Percentage**: Configure deposit requirement

#### Accommodation Management
- **Rooms**:
  - Name, type, description
  - Price per night
  - Min/max occupancy
  - Amenities list
  - Image upload
- **Cottages**:
  - Name, type, description
  - Day rate, night rate
  - Rate availability toggles
  - Min/max occupancy
  - Amenities list
  - Image upload
- **Packages**:
  - Name, description
  - Price
  - Included cottages, rooms, amenities
  - Included entrance fees
  - Image upload

#### Amenity Management
- **Amenity Types**: Pool, gazebo, beach, spa, gym, restaurant, bar, function hall, kids club
- **Pricing**: Free, hourly rate, per-person rate, day pass rate
- **Operating Hours**: Daily schedule with closed days
- **Capacity**: Maximum capacity
- **Equipment**: Available equipment with pricing
- **Rules**: Amenity-specific rules
- **Booking Requirements**: Reservation requirements, duration limits

#### Policy Configuration
- **Check-in/Check-out Times**: Separate for day and night bookings
- **Resort Policies**: Custom policy statements
- **Policy Confirmation**: Guests must confirm policies during booking

#### Discount Configuration
- **Senior Citizen Discount**: Enable/disable, set percentage
- **PWD Discount**: Enable/disable, set percentage
- **Per-Resort Settings**: Each resort configures independently

#### Image Management
- **Multiple Images**: Upload resort gallery
- **Cloudinary Storage**: Cloud-hosted images
- **Image Ordering**: Arrange image display order

### Resort Approval Workflow
1. **Submission**: Admin creates resort listing
2. **Pending Status**: Resort marked as "pending"
3. **Super Admin Review**: Super Admin reviews resort
4. **Approval/Rejection**:
   - Approved: Resort becomes visible to users
   - Rejected: Admin receives rejection reason
5. **Public Visibility**: Only approved resorts appear in search

### Resort Analytics
- **Total Bookings**: Booking count per resort
- **Total Revenue**: Revenue tracking
- **Average Rating**: Guest ratings
- **Review Count**: Number of reviews
- **Occupancy Rate**: Occupancy percentage
- **Performance Metrics**: Custom KPIs

---

## 🔐 Admin Features

### User Management
- **User Listing**: View all registered users
- **Search**: Search by name or email
- **Role Promotion**: Promote users to admin role
- **Role Demotion**: Demote admins to user role
- **Super Admin Protection**: Super Admin cannot be demoted
- **Activity Logging**: Track all role changes

### Resort Approval
- **Pending Resorts**: View resorts awaiting approval
- **Resort Details**: Full resort information review
- **Approve/Reject**: Approve or reject with reason
- **Approval Statistics**: Track approval metrics
- **All Resorts View**: View all resorts in system

### Admin Dashboard
- **System Overview**: High-level system metrics
- **Quick Actions**: Common admin tasks
- **Navigation**: Easy access to all admin features
- **Logout**: Secure logout functionality

### Admin Reports
- **User Reports**: User registration and activity
- **Resort Reports**: Resort performance metrics
- **Booking Reports**: Booking statistics and trends
- **Revenue Reports**: Financial analytics
- **Custom Reports**: Configurable report generation

### Admin Analytics
- **Business Insights**: Comprehensive business analytics
- **Performance Charts**: Visual data representation
- **Forecasting**: Predictive analytics
- **Trend Analysis**: Historical data trends

### Admin Settings
- **System Configuration**: Platform-wide settings
- **Feature Flags**: Enable/disable features
- **Email Configuration**: SMTP settings (prepared)
- **Security Settings**: Authentication and security options

### Identity Verification
- **PWD ID Verification**: Verify PWD identification
- **Account Verification**: Verify user accounts
- **Verification History**: Track verification actions
- **Document Review**: Review uploaded documents

---

## 🔍 Search & Discovery

### Advanced Search Component
- **Destination Search**: Autocomplete with API suggestions
- **Date Range Selection**: Check-in/check-out date picker
- **Guest Count**: Adult and child count selectors
- **Advanced Filters**:
  - Price range filter
  - Star rating filter
  - Hotel type filter
  - Facilities filter
- **Quick Search**: Popular destination shortcuts
- **Real-time Updates**: Live search results

### Search Results
- **Card Display**: Resort cards with key information
- **Pricing Display**: Day rate / Night rate format
- **Image Gallery**: Resort images
- **Rating Display**: Star ratings and review counts
- **Location Info**: City and country
- **Availability Status**: Real-time availability
- **Pagination**: Efficient result navigation

### Resort Detail Page
- **Full Resort Information**: Complete resort details
- **Image Carousel**: Browse resort images
- **Amenities List**: Available amenities
- **Accommodation Options**: Rooms, cottages, packages
- **Pricing Details**: Day/night rates, entrance fees
- **Policies**: Resort policies and rules
- **Contact Information**: Resort contact details
- **Booking Button**: Start booking process
- **Map Integration**: Location display (prepared)

---

## 📊 Analytics & Reporting

### Business Insights Dashboard
- **Total Revenue**: Overall revenue tracking
- **Total Bookings**: Booking count metrics
- **Overview Metrics**: Key performance indicators
- **Popular Destinations**: Top destination analytics
- **Daily Bookings**: Daily booking trends
- **Hotel Performance**: Individual resort performance
- **Forecasting**: Predictive business insights

### Resort Reports
- **Booking Reports**: Detailed booking analytics
- **Revenue Reports**: Financial performance
- **Occupancy Reports**: Occupancy rates and trends
- **Guest Demographics**: Guest analysis
- **Revenue by Accommodation**: Breakdown by room/cottage type
- **Seasonal Trends**: Seasonal booking patterns

### Admin Reports
- **System-wide Analytics**: Platform-level metrics
- **User Growth**: User registration trends
- **Resort Growth**: Resort registration trends
- **Booking Trends**: Platform booking patterns
- **Revenue Analytics**: Total platform revenue
- **Performance Metrics**: System performance KPIs

### Report Features
- **Date Range Filtering**: Custom date ranges
- **Export Options**: Export to various formats
- **Visual Charts**: Graphical data representation
- **Drill-down**: Detailed view capabilities
- **Comparison**: Period-over-period comparison

---

## 🧹 Housekeeping & Maintenance

### Housekeeping Tasks
- **Task Creation**: Create housekeeping tasks
- **Task Assignment**: Assign to staff members
- **Task Status**: Track task completion
- **Priority Levels**: Set task priority
- **Due Dates**: Schedule task deadlines
- **Task History**: Track task modifications

### Maintenance Management
- **Maintenance Requests**: Log maintenance issues
- **Priority Assignment**: Set maintenance priority
- **Status Tracking**: Track repair progress
- **Assignment**: Assign to maintenance staff
- **Completion Tracking**: Mark when completed
- **Cost Tracking**: Track maintenance costs

### Room Blocking
- **Block Rooms**: Temporarily block rooms
- **Block Reasons**: Record blocking reason
- **Block Duration**: Set block date range
- **Block Management**: Manage active blocks

### Staff Management
- **Staff Profiles**: Staff information
- **Department Assignment**: Assign to departments
- **Shift Scheduling**: Weekly shift schedules
- **Hourly Rate**: Staff compensation rates
- **Active Status**: Staff employment status

---

## 📋 Business Rules & Policies

### Payment & Booking Rules
- **Down Payment Required**: Down payment secures reservation
- **Remaining Balance**: Paid at resort front desk
- **Additional Services**: Must be paid at resort (not online)
- **Special Discounts**: Government employee, club member, corporate partner discounts handled at resort only

### Booking Modification Policy
- **8-Hour Window**: Free modifications within 8 hours of booking
- **Auto-Confirmation**: Booking auto-confirms after 8 hours
- **Post-Confirmation Changes**: Require resort contact, may incur fees
- **Change Types**: Dates, room types, guest count (subject to availability)

### User Responsibilities
- **Accurate Information**: Must provide complete and accurate information
- **Payment Validity**: Responsible for payment method validity
- **Credential Security**: Must maintain account credential confidentiality

### Cancellation & Refund Policy
- **Variable Policies**: Policies vary by resort and booking type
- **Down Payment Refunds**: May be non-refundable or subject to fees
- **Policy Review**: Users must review specific policy before confirming
- **Cancellation Methods**: Through platform or direct resort contact

### Liability Limitations
- **Intermediary Role**: Platform acts as booking intermediary only
- **Service Quality**: Not responsible for resort service quality
- **Limited Liability**: Liability limited to payment processing and reservation confirmations
- **Property Liability**: Not liable for loss, damage, or injury at resort properties

### Technical Implications
- **Payment Scope**: Online system handles down payments only
- **Discount Scope**: System excludes special in-person discounts
- **Modification UI**: Enforces 8-hour modification window
- **Dynamic Policies**: Cancellation policy display per resort
- **Payment Processing**: Limited to down payments

---

## 🗄️ Database Schema

### User Collection
```typescript
{
  _id: string;
  email: string;
  password: string; // bcrypt hashed
  firstName: string;
  lastName: string;
  image?: string; // Profile image URL
  role: "user" | "admin" | "resort_owner" | "front_desk" | "housekeeping" | "superAdmin";
  staffProfile?: {
    department: string;
    employeeId: string;
    hireDate: Date;
    shiftSchedule: object;
    hourlyRate: number;
    isActive: boolean;
  };
  permissions: {
    canManageBookings: boolean;
    canManageRooms: boolean;
    canManagePricing: boolean;
    canManageAmenities: boolean;
    canManageActivities: boolean;
    canViewReports: boolean;
    canManageBilling: boolean;
    canManageHousekeeping: boolean;
    canManageMaintenance: boolean;
    canManageUsers: boolean;
  };
  phone?: string;
  address?: object;
  preferences?: object;
  totalBookings?: number;
  totalSpent?: number;
  lastLogin?: Date;
  isActive?: boolean;
  emailVerified?: boolean;
  birthdate?: Date;
  isPWD?: boolean;
  pwdId?: string;
  pwdIdVerified?: boolean;
  pwdVerifiedBy?: string;
  pwdVerifiedAt?: Date;
  accountVerified?: boolean;
  accountVerifiedBy?: string;
  accountVerifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Hotel (Resort) Collection
```typescript
{
  _id: string;
  userId: string; // Resort owner ID
  name: string;
  city: string;
  country: string;
  description: string;
  type: string[];
  facilities: string[];
  dayRate: number;
  nightRate: number;
  hasDayRate: boolean;
  hasNightRate: boolean;
  starRating: number;
  imageUrls: string[];
  lastUpdated: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: object;
  };
  contact?: {
    phone: string;
    email: string;
    website: string;
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  policies?: {
    checkInTime: string;
    checkOutTime: string;
    dayCheckInTime: string;
    dayCheckOutTime: string;
    nightCheckInTime: string;
    nightCheckOutTime: string;
    resortPolicies: object[];
  };
  amenities?: object[];
  rooms?: object[];
  cottages?: object[];
  packages?: object[];
  totalBookings?: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewCount?: number;
  occupancyRate?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  discounts?: {
    seniorCitizenEnabled: boolean;
    seniorCitizenPercentage: number;
    pwdEnabled: boolean;
    pwdPercentage: number;
  };
  status: "pending" | "approved" | "declined";
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  adultEntranceFee?: {
    dayRate: number;
    nightRate: number;
    pricingModel: "per_head" | "per_group";
    groupQuantity: number;
  };
  childEntranceFee?: object[];
  downPaymentPercentage: number;
  gcashNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Booking Collection
```typescript
{
  _id: string;
  userId: string;
  hotelId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  adultCount: number;
  childCount: number;
  checkIn: Date;
  checkOut: Date;
  checkInTime: string;
  checkOutTime: string;
  totalCost: number;
  basePrice: number;
  selectedRooms?: object[];
  selectedCottages?: object[];
  selectedAmenities?: object[];
  roomIds: string[];
  cottageIds: string[];
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  specialRequests?: string;
  cancellationReason?: string;
  refundAmount?: number;
  isPwdBooking: boolean;
  isSeniorCitizenBooking: boolean;
  discountApplied?: {
    type: "pwd" | "senior_citizen" | null;
    percentage: number;
    amount: number;
  };
  changeWindowDeadline?: Date;
  canModify?: boolean;
  verifiedByOwner?: boolean;
  ownerVerificationNote?: string;
  ownerVerifiedAt?: Date;
  rescheduleHistory?: object[];
  modificationHistory?: object[];
  gcashPayment?: {
    gcashNumber?: string;
    referenceNumber?: string;
    amountPaid?: number;
    paymentTime?: Date;
    status?: string;
    screenshotFile?: string;
    rejectionReason?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Payment Transaction Collection
```typescript
{
  _id: string;
  bookingId: string;
  hotelId: string;
  guestId: string;
  amount: number;
  currency: string;
  type: "deposit" | "full" | "incidentals";
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "cancelled";
  paymentMethod: "gcash" | "bank_transfer" | "stripe" | "card" | "cash";
  stripePaymentIntentId?: string;
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
  referenceNumber?: string;
  screenshotUrl?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNote?: string;
  depositPercentage?: number;
  depositAmount?: number;
  remainingAmount?: number;
  refundAmount?: number;
  refundedAt?: Date;
  refundMethod?: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Amenity Collection
```typescript
{
  _id: string;
  hotelId: string;
  name: string;
  type: "pool" | "gazebo" | "beach" | "spa" | "gym" | "restaurant" | "bar" | "function_hall" | "kidsClub" | "other";
  description: string;
  location?: string;
  capacity?: number;
  operatingHours?: object;
  pricing?: {
    isFree: boolean;
    hourlyRate: number;
    perPersonRate: number;
    dayPassRate: number;
  };
  images?: string[];
  amenities?: string[];
  rules?: string[];
  maxAdvanceBookingDays?: number;
  minBookingDuration?: number;
  maxBookingDuration?: number;
  requiresReservation?: boolean;
  equipmentAvailable?: object[];
  status: "operational" | "maintenance" | "closed";
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔌 API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate-token` - Validate JWT token
- `POST /api/auth/forgot-password` - Forgot password (prepared)
- `POST /api/auth/reset-password` - Reset password (prepared)

### Hotel/Resort Endpoints
- `GET /api/hotels` - Search hotels with filters
- `GET /api/hotels/:id` - Get specific hotel details
- `POST /api/my-hotels` - Create new hotel (auth required)
- `PUT /api/my-hotels/:id` - Update hotel details
- `DELETE /api/my-hotels/:id` - Delete hotel listing
- `GET /api/my-hotels` - Get user's hotels

### Booking Endpoints
- `POST /api/hotels/:id/bookings` - Create new booking
- `GET /api/my-bookings` - Get user's booking history
- `GET /api/bookings/hotel/:id` - Get bookings for specific hotel
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/:id/modify` - Modify booking (within 8-hour window)

### Payment Endpoints
- `POST /api/payments/gcash/verify` - Verify GCash payment
- `POST /api/payments/stripe/create-intent` - Create Stripe payment intent
- `POST /api/payments/stripe/confirm` - Confirm Stripe payment
- `GET /api/payments/booking/:id` - Get payment details for booking

### Admin Endpoints
- `GET /api/admin-management/users` - Get all users (Super Admin only)
- `GET /api/admin-management/search-users` - Search users
- `PUT /api/admin-management/promote-to-admin/:userId` - Promote user to admin
- `PUT /api/admin-management/demote-to-user/:userId` - Demote admin to user
- `GET /api/resort-approval/pending` - Get pending resorts
- `GET /api/resort-approval/all` - Get all resorts
- `POST /api/resort-approval/:resortId/approve` - Approve resort
- `POST /api/resort-approval/:resortId/reject` - Reject resort
- `GET /api/resort-approval/stats` - Get approval statistics

### Analytics Endpoints
- `GET /api/business-insights/dashboard` - Get business insights data
- `GET /api/business-insights/forecast` - Get predictive forecasting
- `GET /api/business-insights/system-stats` - Get system statistics
- `GET /api/reports/resort/:id` - Get resort reports
- `GET /api/reports/admin` - Get admin reports

### Amenity Endpoints
- `GET /api/amenities/hotel/:id` - Get amenities for hotel
- `POST /api/amenities` - Create amenity
- `PUT /api/amenities/:id` - Update amenity
- `DELETE /api/amenities/:id` - Delete amenity
- `POST /api/amenity-slots/book` - Book amenity slot

### Housekeeping Endpoints
- `GET /api/housekeeping-tasks/hotel/:id` - Get housekeeping tasks
- `POST /api/housekeeping-tasks` - Create task
- `PUT /api/housekeeping-tasks/:id` - Update task
- `DELETE /api/housekeeping-tasks/:id` - Delete task

### Health Check Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system metrics

---

## 🎨 Frontend Architecture

### Routing Structure
The application uses React Router with the following route structure:

#### Public Routes
- `/` - Home page
- `/search` - Hotel search
- `/detail/:id` - Hotel details
- `/register` - User registration
- `/sign-in` - User login
- `/admin-login` - Admin login (separate portal)
- `/api-docs` - API documentation
- `/api-status` - API status page

#### Protected Routes (Require Authentication)
- `/my-bookings` - User's booking history
- `/my-hotels` - User's resort management
- `/add-hotel` - Add new resort
- `/edit-hotel/:hotelId` - Edit resort
- `/hotel/:hotelId/booking` - Booking page
- `/resort/dashboard` - Resort owner dashboard
- `/resort/reports` - Resort reports
- `/apply-resort-owner` - Apply for resort owner role
- `/website-feedback` - Submit feedback

#### Admin Routes (Require Admin Role)
- `/admin` - Redirect to dashboard
- `/admin/dashboard` - Admin dashboard
- `/admin/admin-management` - User management
- `/admin/resort-approval` - Resort approval
- `/admin/admin-reports` - Admin reports
- `/admin/admin-analytics` - Admin analytics
- `/admin/settings` - Admin settings

### State Management
- **React Context**: Global state for auth, booking selection, search
- **React Query**: Server state management and caching
- **Local State**: Component-level state with useState

### Key Contexts
- **AppContext**: Application-wide state
- **AdminAuthContext**: Admin authentication state
- **BookingSelectionContext**: Booking selection state across pages
- **SearchContext**: Search parameters and filters

### Key Components
- **AdvancedSearch**: Advanced search with filters
- **BookingLogModal**: Booking details modal
- **AccommodationDisplay**: Room/cottage display
- **GuestVerificationLayer**: PWD/Senior Citizen verification
- **GCashPaymentForm**: GCash payment form
- **SmartPaymentWidget**: Payment method selection
- **FreshAccommodationDisplay**: Enhanced accommodation display
- **AdminRouteGuard**: Admin route protection
- **ProtectedRoute**: Authenticated route protection

### Form Components
- **ManageHotelForm**: Resort creation/editing form
- **BookingForm**: Booking information form
- **GuestInfoForm**: Guest information form

### UI Components (Shadcn UI)
- Button, Input, Select, Dialog, Toast, Card, etc.
- Modern, accessible component library
- Tailwind CSS styling

---

## 🚀 Deployment Architecture

### Development Environment
- **Frontend**: Vite dev server on port 5174
- **Backend**: Express server on port 7002
- **Database**: Local MongoDB or MongoDB Atlas

### Production Environment
- **Frontend**: Vercel hosting
- **Backend**: Render hosting
- **Database**: MongoDB Atlas
- **Images**: Cloudinary CDN
- **Admin Portal**: Separate deployment at `/admin` subdirectory

### Environment Variables
#### Backend (.env)
- `MONGODB_CONNECTION_STRING` - MongoDB connection
- `JWT_SECRET_KEY` - JWT signing secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary config
- `CLOUDINARY_API_KEY` - Cloudinary config
- `CLOUDINARY_API_SECRET` - Cloudinary config
- `STRIPE_API_KEY` - Stripe API key
- `FRONTEND_URL` - Frontend URL for CORS

#### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

---

## 🎯 Summary

Glan Getaway is a comprehensive resort booking platform built with the MERN stack, featuring:

### Core Capabilities
- **Multi-role System**: Super Admin, Admin/Resort Owner, Regular User
- **Resort Management**: Complete CRUD with approval workflow
- **Booking System**: Day/night rates, rooms/cottages/amenities, 8-hour modification window
- **Payment Processing**: GCash integration with manual verification
- **Discount System**: Senior Citizen and PWD discounts with verification
- **Search & Discovery**: Advanced filtering and real-time availability
- **Analytics & Reporting**: Business insights and resort performance metrics
- **Admin Features**: User management, resort approval, system oversight

### Technical Highlights
- **Domain-Driven Design**: Modular backend architecture
- **TypeScript**: Full-stack type safety
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access Control**: Granular permissions
- **Cloudinary Integration**: Cloud image storage
- **MongoDB Atlas**: Cloud database
- **React Query**: Efficient server state management
- **Shadcn UI**: Modern component library

### Business Rules
- Down payment secures reservation (configurable %)
- Remaining balance paid at resort
- 8-hour modification window for bookings
- Special discounts handled at resort only
- Platform acts as booking intermediary
- PWD/Senior Citizen discounts require verification

This platform provides a complete solution for resort booking management in the Philippines, with features tailored to local business practices and requirements.
