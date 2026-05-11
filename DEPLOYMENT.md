# GlanGetaway Deployment Guide

## Environment Configuration

The application now supports both local development and production deployment with automatic environment detection.

### Local Development

**Frontend (.env):**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_PRODUCTION_API_URL=https://glangetaway-2-1.onrender.com

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_qhbySbatHadEroU67YNHanX9

# Environment
VITE_NODE_ENV=development
```

**Backend (.env):**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGODB_CONNECTION_STRING=mongodb://localhost:27017/hotel-booking

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5174
BACKEND_URL=http://localhost:5000
```

### Production Deployment

**Frontend (.env.production):**
```env
VITE_API_BASE_URL=https://glangetaway-2-1.onrender.com
VITE_PRODUCTION_API_URL=https://glangetaway-2-1.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_qhbySbatHadEroU67YNHanX9
VITE_NODE_ENV=production
```

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=5000
MONGODB_CONNECTION_STRING=mongodb+srv://glangetaway-admin:jojgOfwCODul855G@cluster0.koifai3.mongodb.net/hotel-booking?retryWrites=true&w=majority
FRONTEND_URL=https://glangetaway-2-1.onrender.com
BACKEND_URL=https://glangetaway-2-1.onrender.com
ALLOWED_ORIGINS=https://glangetaway-2-1.onrender.com,https://mern-booking-hotel.netlify.app
```

## Environment Detection Logic

The frontend automatically detects the environment and configures API endpoints:

1. **Local Development** (`localhost` or `127.0.0.1`):
   - Uses `http://localhost:5000`
   - Enables development features

2. **Production** (any other hostname):
   - Uses `https://glangetaway-2-1.onrender.com`
   - Production optimizations enabled

3. **Environment Variables Priority**:
   - `VITE_API_BASE_URL` (highest priority)
   - `VITE_PRODUCTION_API_URL` (production fallback)
   - Auto-detection (fallback)

## Running the Application

### Local Development
```bash
# Backend
cd hotel-booking-backend
npm run dev

# Frontend
cd hotel-booking-frontend
npm run dev
```

### Production Deployment
```bash
# Backend (Render/Heroku)
npm run build
npm start

# Frontend (Netlify/Vercel)
npm run build
# Deploy dist/ folder
```

## CORS Configuration

The backend CORS middleware automatically handles both environments:
- Development: Allows localhost origins
- Production: Allows specified production domains
- Supports credentials and all necessary headers

## Environment Debugging

The application includes environment logging. Check browser console for:
- Current environment (development/production)
- API base URL being used
- Environment variables loaded
- Hostname detection

## Testing Both Environments

1. **Local Testing**: Run both servers locally and verify API connectivity
2. **Production Testing**: Deploy and verify automatic production URL detection
3. **Cross-Origin Testing**: Test CORS between different domains
4. **Environment Switching**: Verify correct environment detection

## Troubleshooting

### API Connection Issues
1. Check environment variables in browser console
2. Verify backend server is running
3. Check CORS configuration
4. Confirm hostname detection

### Deployment Issues
1. Ensure production environment files are correctly configured
2. Verify build process includes environment variables
3. Check deployment platform environment variable handling
4. Test CORS configuration in production

## Security Notes

- Production secrets should be stored in deployment platform environment variables
- Development secrets should not be committed to version control
- CORS is configured to allow only specific origins in production
- JWT secrets are different between environments
