# Three-Tier Account System Setup Guide

This guide will help you set up and configure the new three-tier account system for your resort booking website.

## 🏗️ System Overview

The system now supports three user roles:

### 1. **Super Admin** 
- **Email**: `superadmin@glangetaway.com` (default)
- **Password**: `SuperAdmin123!` (default)
- **Permissions**: 
  - Full access to all website data
  - Can approve/reject any resort
  - Can manage all users and bookings
  - Can access admin dashboard and analytics

### 2. **Admin/Frontdesk**
- **Permissions**:
  - Can publish and manage their own resorts
  - Can view and manage bookings for their resorts
  - **Requires Super Admin approval** before resorts become visible
  - Limited to their own resort data only

### 3. **User**
- **Permissions**:
  - Can search and view approved resorts
  - Can make bookings and payments
  - Cannot create or publish resorts
  - Can manage their own bookings

## 🚀 Setup Instructions

### Step 1: Environment Configuration

Add these new environment variables to your `.env` file:

```env
# Super Admin Account Configuration
SUPER_ADMIN_EMAIL=superadmin@glangetaway.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!

# Existing variables (ensure these are set)
MONGODB_CONNECTION_STRING=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
STRIPE_API_KEY=your_stripe_key
```

### Step 2: Database Migration

Run the migration script to update your existing database:

```bash
cd hotel-booking-backend
npm run migrate-three-tier
```

Or run directly:
```bash
npx ts-node scripts/migrate-to-three-tier-system.ts
```

**What the migration does:**
- Converts existing `hotel_owner` roles to `admin`
- Sets default roles for users without roles
- Adds approval system fields to existing hotels
- Auto-approves existing hotels (they were already visible)

### Step 3: Create Super Admin Account

Run the Super Admin initialization script:

```bash
cd hotel-booking-backend
npm run init-super-admin
```

Or run directly:
```bash
npx ts-node scripts/init-super-admin.ts
```

**This will:**
- Create the Super Admin account with specified credentials
- Set the role to `super_admin`
- Mark email as verified
- Display the credentials (save them securely!)

### Step 4: Update Package.json Scripts

Add these scripts to your `backend/package.json`:

```json
{
  "scripts": {
    "migrate-three-tier": "npx ts-node scripts/migrate-to-three-tier-system.ts",
    "init-super-admin": "npx ts-node scripts/init-super-admin.ts",
    "setup-three-tier": "npm run migrate-three-tier && npm run init-super-admin"
  }
}
```

### Step 5: Test the System

1. **Start the backend server:**
   ```bash
   npm start
   ```

2. **Test Super Admin login:**
   - Go to frontend login page
   - Use: `superadmin@glangetaway.com` / `SuperAdmin123!`
   - Verify you have access to admin features

3. **Test Admin workflow:**
   - Create a new admin account
   - Login as admin
   - Create a new resort
   - Verify it shows as "pending approval"

4. **Test Super Admin approval:**
   - Login as Super Admin
   - Go to resort approval section
   - Approve the pending resort
   - Verify it becomes visible to users

## 🔧 API Endpoints

### New Resort Approval Endpoints

- `GET /api/resort-approval/pending` - Get pending resorts (Admin only)
- `GET /api/resort-approval/all` - Get all resorts (Admin only)
- `POST /api/resort-approval/:resortId/approve` - Approve resort (Admin only)
- `POST /api/resort-approval/:resortId/reject` - Reject resort (Admin only)
- `GET /api/resort-approval/stats` - Get approval statistics (Admin only)

### Updated Search Behavior

- Regular users only see **approved** resorts
- Admins see all their resorts (approved and pending)
- Super Admin sees all resorts in the system

## 📊 Database Schema Changes

### User Collection
```javascript
// Before
role: "user" | "admin" | "hotel_owner"

// After  
role: "user" | "admin" | "super_admin"
```

### Hotel Collection
```javascript
// New fields added
isApproved: Boolean (default: false)
approvedBy: String (Super Admin ID)
approvedAt: Date
rejectionReason: String
```

## 🔄 Workflow Examples

### New Resort Submission Flow
1. Admin creates resort → Status: "pending"
2. Super Admin reviews → Status: "approved" or "rejected"
3. If approved → Resort becomes visible to users
4. If rejected → Admin gets rejection reason

### User Role Hierarchy
```
Super Admin
├── Can approve/reject any resort
├── Can manage all users
├── Can access all data
└── Full system control

Admin
├── Can create/manage own resorts
├── Can manage bookings for own resorts
├── Limited to own data
└── Needs approval for new resorts

User  
├── Can search/view approved resorts
├── Can make bookings
├── Can manage own bookings
└── No resort creation access
```

## 🛡️ Security Features

- **Role-based middleware** prevents unauthorized access
- **JWT tokens** include user role information
- **Ownership verification** for resource access
- **Approval workflow** prevents unauthorized resort publication

## 🚨 Important Notes

1. **Change Default Passwords**: After first login, immediately change the Super Admin password
2. **Backup Database**: Always backup before running migrations
3. **Test Thoroughly**: Test all role permissions before going live
4. **Monitor Logs**: Check server logs for any permission issues

## 🐛 Troubleshooting

### Common Issues

1. **Migration fails**:
   - Check MongoDB connection string
   - Ensure database is accessible
   - Check for existing data conflicts

2. **Super Admin creation fails**:
   - Verify email isn't already in use
   - Check password meets requirements
   - Ensure MongoDB is connected

3. **Permission denied errors**:
   - Verify JWT token is valid
   - Check user role in database
   - Ensure middleware is applied correctly

4. **Resorts not showing**:
   - Check if resort is approved
   - Verify search filters
   - Check user role permissions

### Debug Commands

```bash
# Check user roles in database
db.users.find({}, {email: 1, role: 1})

# Check resort approval status
db.hotels.find({}, {name: 1, isApproved: 1, userId: 1})

# Check pending resorts
db.hotels.find({isApproved: false})
```

## 📞 Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test with the provided troubleshooting commands

The system is now ready for production use with the three-tier account structure! 🎉
