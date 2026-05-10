# 🔧 Hotel Booking API - Setup & Troubleshooting Guide

## 📋 Table of Contents
- [Initial Setup](#initial-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Common Issues & Fixes](#common-issues--fixes)
- [Image Serving Issues](#image-serving-issues)
- [CORS Problems](#cors-problems)
- [API Testing](#api-testing)
- [Deployment Guide](#deployment-guide)
- [Debugging Checklist](#debugging-checklist)

## 🛠️ Initial Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/MayoBee/GlanGetaway_2.git
cd ResortManagementBooking

# Install dependencies for all packages
npm install

# Or install per package
cd packages/backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Copy the example environment files:

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
```

### 3. Start Development Servers

```bash
# Start backend (from packages/backend)
npm run dev

# Start frontend (from packages/frontend)
npm run dev

# Or start both with turbo
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/hotel-booking

# JWT Configuration
JWT_SECRET_KEY=your-super-secure-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe Configuration (for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# Frontend URLs (for CORS)
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:5000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# CORS Configuration
CORS_ORIGIN=http://localhost:5174
ALLOWED_ORIGINS=http://localhost:5174
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

### Production Environment Variables (Render)

Set these in your Render dashboard:

```env
NODE_ENV=production
MONGODB_CONNECTION_STRING=your-mongodb-atlas-connection-string
JWT_SECRET_KEY=your-production-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
FRONTEND_URL=https://your-vercel-frontend-domain.vercel.app
BACKEND_URL=https://your-render-backend-domain.onrender.com
ALLOWED_ORIGINS=https://your-vercel-frontend-domain.vercel.app
```

## 🗄️ Database Setup

### Local MongoDB

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use MongoDB Atlas (recommended for production)
```

### Database Connection Issues

**Error:** `MongoServerError: Authentication failed`

**Fix:**
```bash
# Check your connection string format
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**Error:** `MongoNetworkError: connect ECONNREFUSED`

**Fix:**
```bash
# For local MongoDB
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/hotel-booking

# For Docker MongoDB
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/hotel-booking
```

## 🚨 Common Issues & Fixes

### 1. API Not Responding

**Symptoms:**
- Frontend shows loading forever
- Network errors in browser console
- `ERR_CONNECTION_REFUSED`

**Checks:**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check backend logs
cd packages/backend && npm run dev

# Check port conflicts
netstat -ano | findstr :5000
```

**Fix:**
```bash
# Kill process using port 5000
npx kill-port 5000

# Restart backend
cd packages/backend && npm run dev
```

### 2. Database Connection Failed

**Symptoms:**
- `MongoServerError: Authentication failed`
- `MongoNetworkError: connect ECONNREFUSED`

**Fix:**
```bash
# Update .env with correct MongoDB URI
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/hotel-booking

# For MongoDB Atlas
MONGODB_CONNECTION_STRING=mongodb+srv://user:pass@cluster.mongodb.net/hotel-booking
```

### 3. JWT Authentication Issues

**Symptoms:**
- Login doesn't work
- Protected routes show unauthorized

**Fix:**
```bash
# Check JWT secret length (must be at least 32 characters)
JWT_SECRET_KEY=your-super-secure-jwt-key-min-32-characters-long

# Clear localStorage and try again
localStorage.clear()
```

## 🖼️ Image Serving Issues

### 1. Images Not Loading (404 Errors)

**Symptoms:**
- Images show as broken/broken image icon
- Console shows `LOAD_ERROR`
- SmartImage component fails

**Debug:**
```bash
# Check if images exist
ls -la packages/backend/uploads/

# Check backend static file serving
curl -I http://localhost:5000/uploads/filename.jpg

# Check database image URLs
# Query MongoDB for image URLs
```

**Fix:**

1. **Update ImageService URL Generation:**
```typescript
// In packages/backend/src/services/imageService.ts
const backendUrl = process.env.BACKEND_URL || process.env.BACKEND_BASE_URL;
if (backendUrl) {
  this.baseUrl = backendUrl.replace(/\/$/, "");
} else {
  this.baseUrl = `http://localhost:${process.env.PORT || 7002}`;
}
```

2. **Fix Static File Serving:**
```typescript
// In packages/backend/src/bootstrap.ts
const uploadsPath = path.join(__dirname, '..', '..', 'uploads');
console.log('🔧 Static uploads path:', uploadsPath);

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));
```

3. **Migrate Existing URLs (if needed):**
```bash
cd packages/backend
npx ts-node scripts/migrate-image-urls.ts
```

### 2. CORS Issues with Images

**Symptoms:**
- Images load locally but not in production
- CORS errors in browser console

**Fix:**
```env
# Add to backend .env
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🔒 CORS Problems

### 1. Frontend Can't Access Backend

**Symptoms:**
- `Access to XMLHttpRequest at '...' has been blocked by CORS policy`
- API calls fail with CORS errors

**Checks:**
```bash
# Check CORS headers
curl -H "Origin: http://localhost:5174" -v http://localhost:5000/api/health
```

**Fix:**

1. **Update CORS Configuration:**
```typescript
// In packages/backend/src/middleware/cors.ts
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ALLOWED_ORIGINS,
  "http://localhost:5174",
  "https://your-production-domain.vercel.app",
].filter(Boolean);
```

2. **Environment Variables:**
```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

## 🧪 API Testing

### Health Check

```bash
# Basic health check
curl http://localhost:5000/api/health

# With headers
curl -H "Content-Type: application/json" http://localhost:5000/api/health
```

### Authentication Test

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get hotels (with auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5000/api/hotels
```

### Image Upload Test

```bash
# Test image serving
curl -I http://localhost:5000/uploads/sample.jpg

# Check if directory exists
ls -la packages/backend/uploads/
```

## 🚀 Deployment Guide

### Render Backend Deployment

1. **Connect Repository:**
   - Go to Render dashboard
   - Create new Web Service
   - Connect to GitHub repo

2. **Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_CONNECTION_STRING=your-mongodb-atlas-uri
   JWT_SECRET_KEY=your-production-jwt-secret
   BACKEND_URL=https://your-render-app.onrender.com
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   STRIPE_PUBLISHABLE_KEY=your-stripe-pub-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   ```

3. **Build Settings:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Vercel Frontend Deployment

1. **Connect Repository:**
   - Go to Vercel dashboard
   - Import Git repository

2. **Environment Variables:**
   ```
   VITE_API_BASE_URL=https://your-render-backend.onrender.com
   VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-pub-key
   ```

3. **Build Settings:**
   - Framework Preset: Vite
   - Root Directory: `packages/frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

## 🔍 Debugging Checklist

### When API Breaks

1. **Check Backend Status:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check Logs:**
   ```bash
   # Backend logs
   cd packages/backend && npm run dev

   # Frontend logs (browser console)
   # Open DevTools → Console tab
   ```

3. **Check Environment Variables:**
   ```bash
   cd packages/backend
   node -e "console.log(require('dotenv').config())"
   ```

4. **Check Database Connection:**
   ```bash
   cd packages/backend
   node -e "require('./src/config/database').connectDB().then(() => console.log('DB connected')).catch(console.error)"
   ```

5. **Check CORS Headers:**
   ```bash
   curl -H "Origin: http://localhost:5174" -v http://localhost:5000/api/health
   ```

### When Images Don't Load

1. **Check File Existence:**
   ```bash
   ls -la packages/backend/uploads/
   ```

2. **Check Image URLs in Database:**
   ```javascript
   // Connect to MongoDB and check image URLs
   db.hotels.find({}, {imageUrls: 1, images: 1})
   ```

3. **Check Static File Serving:**
   ```bash
   curl -I http://localhost:5000/uploads/filename.jpg
   ```

4. **Check CORS for Images:**
   ```bash
   curl -H "Origin: https://your-frontend.vercel.app" -v http://localhost:5000/uploads/filename.jpg
   ```

### When Authentication Fails

1. **Check JWT Secret:**
   ```bash
   # Must be at least 32 characters
   echo $JWT_SECRET_KEY | wc -c
   ```

2. **Check Token Expiration:**
   ```bash
   # JWT_EXPIRES_IN should be reasonable (e.g., 7d)
   ```

3. **Clear Browser Storage:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```

## 🆘 Emergency Recovery

### If Everything Breaks

1. **Reset to Last Working Commit:**
   ```bash
   git log --oneline -10
   git reset --hard <working-commit-hash>
   ```

2. **Clean Reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Reset Database:**
   ```bash
   # Drop and recreate database
   mongo hotel-booking --eval "db.dropDatabase()"
   ```

4. **Check File Permissions:**
   ```bash
   chmod +x packages/backend/uploads/
   ```

## 📞 Support

If issues persist:

1. **Check GitHub Issues:** Look for similar problems
2. **Run Diagnostics:**
   ```bash
   npm run test:api  # If test script exists
   ```
3. **Collect Debug Info:**
   ```bash
   # System info
   node --version
   npm --version

   # Environment
   env | grep -E "(NODE|MONGODB|JWT)"

   # Logs
   tail -f packages/backend/logs/*.log
   ```

## 🎯 Quick Fixes Reference

| Problem | Quick Fix |
|---------|-----------|
| CORS Error | Add domain to `ALLOWED_ORIGINS` |
| Images 404 | Update `BACKEND_URL` in ImageService |
| Auth Issues | Check JWT secret length |
| DB Connection | Verify MongoDB URI format |
| Port Conflict | `npx kill-port 5000` |
| Build Errors | `rm -rf node_modules && npm install` |

---

**Last Updated:** 2026-05-06
**Version:** 0.15</content>
<parameter name="filePath">API_SETUP_GUIDE.md