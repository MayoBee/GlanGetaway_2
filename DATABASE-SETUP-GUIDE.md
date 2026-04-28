# Database Setup & Persistence Guide

## 🎯 Current Status
✅ **Database Connected**: MongoDB is running and connected  
✅ **Data Exists**: 1 user account + 1 beach resort found  
✅ **Collections Ready**: users, hotels, bookings, reports  

## 🚀 Quick Start Commands

### 1. Start Servers (Always do this first)
```bash
# Terminal 1 - Backend
cd hotel-booking-backend
npm run dev

# Terminal 2 - Frontend  
cd hotel-booking-frontend
npm run dev
```

### 2. Database Management Commands
```bash
# Initialize database (creates indexes, sets up collections)
npm run init-db

# Check database status and data count
npm run check-db
```

## 📋 Database Connection Details

- **Database Name**: `hotel-booking`
- **Connection String**: `mongodb://localhost:27017/hotel-booking`
- **Port**: 27017 (MongoDB default)
- **Collections**: users, hotels, bookings, reports

## 🔧 Environment Setup

Create a `.env` file in `hotel-booking-backend/`:
```env
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/hotel-booking
JWT_SECRET_KEY=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_API_KEY=sk_test_your-stripe-key
NODE_ENV=development
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:7002
```

## 🛡️ Data Persistence Tips

### 1. MongoDB Service
- Ensure MongoDB service is always running
- On Windows: Check Services for "MongoDB"
- Or use MongoDB Compass to verify connection

### 2. Port Configuration
- Backend runs on port 7002
- Frontend runs on port 5174 (or 5175 if 5174 is busy)
- Both ports are now configured for CORS

### 3. Database Backups
```bash
# Backup database
mongodump --db hotel-booking --out ./backup

# Restore database
mongorestore --db hotel-booking ./backup/hotel-booking
```

## 🔍 Troubleshooting

### Issue: "Can't find my data"
1. Run `npm run check-db` to verify data exists
2. Check MongoDB Compass for the `hotel-booking` database
3. Ensure backend is connecting to correct database

### Issue: "Connection refused"
1. Check if MongoDB is running: `netstat -ano | findstr :27017`
2. Restart MongoDB service if needed
3. Verify connection string in .env file

### Issue: "Port conflicts"
1. Kill process on port 7002: `taskkill /PID [PID] /F`
2. Kill process on port 5174: `taskkill /PID [PID] /F`
3. Restart servers

### Issue: "CORS errors"
1. Frontend and backend ports must match allowed origins
2. Currently configured for: 5173, 5174, 5175

## 📊 Current Data Summary
- **Users**: 1 account
- **Hotels**: 1 beach resort
- **Bookings**: 0 (new)
- **Reports**: 0 (new)

## 🔄 Daily Workflow

1. **Start MongoDB** (if not running)
2. **Run `npm run check-db`** (verify data)
3. **Start both servers** (backend + frontend)
4. **Access website** at http://localhost:5174
5. **Your data persists** automatically in MongoDB

## 🎉 Success Indicators

✅ Backend shows: `✅ MongoDB connected successfully`  
✅ Backend shows: `📦 Database: hotel-booking`  
✅ Frontend loads without errors  
✅ Your account and resort are visible  

---

**Your data is now properly connected and will persist between sessions!**
