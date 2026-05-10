# 🚀 Free Deployment Guide for Glan Getaway Resort Booking

## 📋 Prerequisites
- GitHub repository with your code
- MongoDB Atlas account
- Render account
- Vercel account
- Cloudinary account (for image uploads)
- Stripe account (for payments)

---

## 🗄️ Step 1: Setup MongoDB Atlas (Free)

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Build Database**: 
   - Click "Build a Database"
   - Select "M0 Sandbox" (FREE)
   - Choose cloud provider and region closest to you
3. **Create Database User**:
   - Username: `glangetaway-admin`
   - Password: Generate strong password
   - Save credentials securely
4. **Network Access**:
   - Add IP: `0.0.0.0/0` (allows all IPs - required for cloud deployment)
5. **Get Connection String**:
   ```
   mongodb+srv://glangetaway-admin:PASSWORD@cluster.mongodb.net/hotel-booking
   ```

---

## 🔧 Step 2: Prepare Backend for Render

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Render**:
   - Go to [Render](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - **Service Details**:
     - Name: `glan-getaway-backend`
     - Root Directory: `hotel-booking-backend`
     - Runtime: `Docker`
     - Instance Type: `Free`
   - **Environment Variables**:
     ```
     MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/hotel-booking
     JWT_SECRET_KEY=your-super-secure-production-jwt-key-min-32-chars
     NODE_ENV=production
     PORT=5000
     CLOUDINARY_CLOUD_NAME=your-cloudinary-name
     CLOUDINARY_API_KEY=your-cloudinary-key
     CLOUDINARY_API_SECRET=your-cloudinary-secret
     STRIPE_API_KEY=sk_test_your-stripe-test-key
     FRONTEND_URL=https://your-frontend-domain.vercel.app
     ```

3. **Deploy**: Click "Create Web Service"

---

## 🎨 Step 3: Deploy Frontend to Vercel

1. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Project Settings**:
     - Root Directory: `hotel-booking-frontend`
     - Framework: `Vite`
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - **Environment Variables**:
     ```
     VITE_API_BASE_URL=https://your-backend-app.onrender.com
     ```

2. **Deploy**: Click "Deploy"

---

## 🔗 Step 4: Update API Configuration

After deployment, update these values:

### Backend (Render)
- Get your backend URL from Render dashboard
- Update `FRONTEND_URL` environment variable

### Frontend (Vercel)
- Update `VITE_API_BASE_URL` environment variable
- Add your backend URL from Render

---

## 🧪 Step 5: Test Deployment

1. **Backend Health Check**:
   ```
   https://your-backend-app.onrender.com/api/health
   ```

2. **Frontend Access**:
   ```
   https://your-frontend-domain.vercel.app
   ```

3. **Test Features**:
   - User registration/login
   - Hotel browsing
   - Booking process
   - Payment integration

---

## 📊 Free Tier Limits

### MongoDB Atlas (M0 Sandbox)
- **Storage**: 512MB
- **RAM**: Shared
- **Connections**: 100 connections
- **Perfect for**: Small to medium resort booking

### Render (Free)
- **Compute**: 750 hours/month
- **RAM**: 512MB
- **CPU**: 0.2 shared
- **Sleeps**: After 15 minutes inactivity
- **Wakes**: On request (may take 30 seconds)

### Vercel (Hobby)
- **Bandwidth**: 100GB/month
- **Builds**: Unlimited
- **Domains**: Custom domains supported
- **SSL**: Automatic

---

## 🚨 Important Notes

### Security
- Use strong, unique passwords
- Enable 2FA on all accounts
- Never commit secrets to Git
- Use environment variables for all sensitive data

### Performance
- Free tiers have limitations
- Backend may sleep when inactive
- Consider upgrading for production use
- Monitor usage regularly

### Custom Domains
- Both Render and Vercel support custom domains
- Update DNS records accordingly
- SSL certificates are automatic

---

## 🔄 CI/CD Pipeline

Your setup now includes automatic deployments:
1. **Push to GitHub** → Auto-deploy to Render/Vercel
2. **Environment variables** keep secrets safe
3. **Zero-downtime deployments** with instant rollbacks

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Docs**: https://docs.mongodb.com/atlas
- **Issues**: Check logs in respective dashboards

---

## 🎉 You're Live!

Your resort booking website is now deployed for free! Users can:
- Browse resorts
- Make bookings
- Process payments
- Manage reservations

**Next Steps**:
1. Monitor performance
2. Set up analytics
3. Configure custom domains
4. Plan for scaling as you grow
