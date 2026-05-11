# Admin Dashboard Decoupling - Deployment Guide

## Overview
This guide explains how to deploy the decoupled admin dashboard using subdirectory routing (`yoursite.com/admin`).

## Architecture

```
yoursite.com/           → Main Frontend (hotel-booking-frontend)
yoursite.com/admin      → Admin Frontend (hotel-booking-admin)
yoursite.com/api/*      → Backend API (hotel-booking-backend)
```

## Environment Variables

### Backend (.env)
```
# Existing variables
MONGODB_CONNECTION_STRING=
JWT_SECRET_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=

# Frontend URLs (for CORS)
FRONTEND_URL=https://yoursite.com
BACKEND_URL=https://yoursite.com/api

# For subdirectory support, the backend now automatically allows:
# - https://yoursite.com (main site)
# - https://yoursite.com/admin (admin subdirectory)
```

### Main Frontend (.env)
```
VITE_API_BASE_URL=https://yoursite.com/api
VITE_ADMIN_URL=/admin
```

### Admin Frontend (.env)
```
VITE_API_BASE_URL=https://yoursite.com/api
```

## Nginx Configuration

### Option 1: Single Server Block

```nginx
server {
    listen 80;
    server_name yoursite.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yoursite.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }
    
    # Admin Frontend (MUST be before root location)
    location /admin {
        alias /var/www/hotel-booking-admin/dist;
        try_files $uri $uri/ /admin/index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Main Frontend
    location / {
        root /var/www/hotel-booking-frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Error handling
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### Option 2: Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./hotel-booking-frontend/dist:/var/www/main:ro
      - ./hotel-booking-admin/dist:/var/www/admin:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build: ./hotel-booking-backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_CONNECTION_STRING=${MONGODB_CONNECTION_STRING}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - FRONTEND_URL=https://yoursite.com
      - BACKEND_URL=https://yoursite.com/api
    networks:
      - app-network

  # Optional: Serve static files directly without Nginx
  # main-frontend:
  #   image: nginx:alpine
  #   volumes:
  #     - ./hotel-booking-frontend/dist:/usr/share/nginx/html:ro
  #   networks:
  #     - app-network

  # admin-frontend:
  #   image: nginx:alpine
  #   volumes:
  #     - ./hotel-booking-admin/dist:/usr/share/nginx/html:ro
  #   networks:
  #     - app-network

networks:
  app-network:
    driver: bridge
```

## Build Instructions

### 1. Build Main Frontend
```bash
cd hotel-booking-frontend
npm install
npm run build
# Output: dist/ folder
```

### 2. Build Admin Frontend
```bash
cd hotel-booking-admin
npm install
npm run build
# Output: dist/ folder
```

### 3. Build Backend (if using TypeScript)
```bash
cd hotel-booking-backend
npm install
npm run build
# Output: dist/ folder
```

## Deployment Steps

### Production Deployment

1. **Prepare Environment**
   ```bash
   # Set environment variables
   export NODE_ENV=production
   export FRONTEND_URL=https://yoursite.com
   export BACKEND_URL=https://yoursite.com/api
   ```

2. **Build All Applications**
   ```bash
   # Build main frontend
   cd hotel-booking-frontend && npm run build
   
   # Build admin frontend
   cd hotel-booking-admin && npm run build
   
   # Build backend
   cd hotel-booking-backend && npm run build
   ```

3. **Deploy to Server**
   ```bash
   # Copy built files to server
   scp -r hotel-booking-frontend/dist user@server:/var/www/main
   scp -r hotel-booking-admin/dist user@server:/var/www/admin
   
   # Copy and start backend
   scp -r hotel-booking-backend/dist user@server:/opt/backend
   ssh user@server "cd /opt/backend && npm install --production && pm2 start dist/src/index.js"
   ```

4. **Configure Nginx**
   - Copy nginx.conf to server
   - Test configuration: `nginx -t`
   - Reload Nginx: `nginx -s reload`

## Security Considerations

### 1. Admin Access Control
- Admin users **CANNOT** log in through the main website
- Backend middleware blocks admin login from non-admin origins
- Frontend automatically redirects admin users to `/admin`

### 2. CORS Configuration
- Backend allows specific origins only
- Admin subdirectory (`/admin`) is explicitly whitelisted
- Credentials are enabled for cookie-based auth

### 3. JWT Token Storage
- Tokens stored in localStorage for both frontends
- Tokens are isolated per domain/subdomain
- Automatic token validation on page load

## Troubleshooting

### Admin Login Blocked
If admin gets "Admin access restricted" error:
1. Ensure accessing via `yoursite.com/admin`
2. Check browser console for CORS errors
3. Verify backend CORS settings include `/admin` origin

### 404 Errors on Admin Routes
If `/admin/dashboard` returns 404:
1. Verify Nginx `try_files` directive includes `/admin/index.html`
2. Check that admin build output is in correct directory
3. Ensure Nginx location block for `/admin` is before root location

### CORS Errors
If seeing CORS errors:
1. Check backend CORS allowed origins
2. Verify `credentials: true` is set in both frontend and backend
3. Ensure `FRONTEND_URL` environment variable matches actual URL

## Verification Checklist

- [ ] Main site loads at `yoursite.com`
- [ ] Admin site loads at `yoursite.com/admin`
- [ ] API works at `yoursite.com/api/health`
- [ ] Regular user can log in on main site
- [ ] Admin user gets redirected when trying to log in on main site
- [ ] Admin user can log in on admin site
- [ ] JWT tokens are properly shared
- [ ] CORS headers are correct in browser Network tab

## Testing Commands

```bash
# Test API connectivity
curl https://yoursite.com/api/health

# Test CORS (should return 200)
curl -H "Origin: https://yoursite.com/admin" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://yoursite.com/api/auth/login

# Verify admin access restriction (should return 403)
curl -X POST https://yoursite.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://yoursite.com" \
  -d '{"email":"admin@example.com","password":"password"}'
```
