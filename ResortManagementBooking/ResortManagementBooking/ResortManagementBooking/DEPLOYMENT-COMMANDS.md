# 🚀 Deployment Commands Guide

## Quick Deploy Commands

### 1. Local Development Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### 2. Build for Production
```bash
# Build all packages
npm run build

# Build individual packages
cd packages/backend && npm run build
cd packages/frontend && npm run build
```

### 3. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild with no cache
docker-compose build --no-cache
```

### 4. Environment Setup
```bash
# Copy environment files
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Edit environment variables
notepad packages/backend/.env
notepad packages/frontend/.env
```

## Platform-Specific Deployment

### Render (Backend)
```bash
# Deploy to Render
1. Push to GitHub
2. Connect repository to Render
3. Use render.yaml configuration
4. Set environment variables in Render dashboard
```

### Vercel (Frontend)
```bash
# Deploy to Vercel
1. Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd packages/frontend
vercel --prod

# Link existing project
vercel link
```

### Manual Server Deployment
```bash
# Build applications
npm run build

# Deploy to server
scp -r packages/frontend/dist user@server:/var/www/frontend
scp -r packages/backend/dist user@server:/opt/backend

# Start backend on server
ssh user@server "cd /opt/backend && npm install --production && pm2 start dist/src/index.js"
```

## Environment Variables Checklist

### Backend Required Variables:
- [ ] `MONGODB_CONNECTION_STRING`
- [ ] `JWT_SECRET_KEY`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `FRONTEND_URL`

### Frontend Required Variables:
- [ ] `VITE_API_BASE_URL`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`

## Health Checks
```bash
# Backend health
curl https://your-backend.onrender.com/api/health

# Frontend access
curl https://your-frontend.vercel.app

# Database connection test
curl -X POST https://your-backend.onrender.com/api/health/detailed
```

## Troubleshooting Commands
```bash
# Check Docker containers
docker ps
docker logs container-name

# Check PM2 processes
pm2 list
pm2 logs

# Test API endpoints
curl -X GET "https://your-backend/api/hotels" -H "Content-Type: application/json"

# Clear Vercel cache
vercel --prod --force
```
