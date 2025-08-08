# 🚀 WAG Movie Reviews - Deployment Guide

This guide covers deploying your movie review application using **Netlify** for the frontend and **Render* for the backend.

## 📋 Prerequisites

- Node.js 18+ installed locally
- Git repository set up
- TMDB API key
- MongoDB Atlas account (recommended for production)

## 🌐 Frontend Deployment (Netlify)

### Option 1: Netlify CLI (Recommended)

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and Deploy**
   ```bash
   # From project root
   npm run build:frontend
   
   # Deploy to Netlify
   npm run deploy:netlify
   ```

3. **Set Environment Variables in Netlify Dashboard**
   - `VITE_API_URL` = Your backend URL (e.g., `https://your-app.onrender.com/api/v1`)
   - `VITE_APP_NAME` = WAG Movie Reviews
   - `VITE_TMDB_IMAGE_BASE_URL` = https://image.tmdb.org/t/p/

### Option 2: Git Integration

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   - **Build command**: `cd frontend && npm run build`
   - **Publish directory**: `frontend/dist`
   - **Base directory**: Leave empty

3. **Environment Variables**
   - Set the same variables as Option 1 in Netlify's environment settings

## 🖥️ Backend Deployment

### Option 1: Render

1. **Create Render Account**
   - Go to [Render](https://render.com/) and sign up

2. **Deploy from Git**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`
     - **Environment**: `Node`

3. **Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   TMDB_API_KEY=your_tmdb_api_key
   CLIENT_URL=https://your-netlify-app.netlify.app
   PORT=10000
   ```

4. **Database Setup**
   - Add MongoDB database in Render
   - Or use MongoDB Atlas (recommended)

## 🗄️ Database Setup (MongoDB Atlas)

1. **Create Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a free cluster

2. **Network Access**
   - Add `0.0.0.0/0` to IP whitelist (for production, use specific IPs)

3. **Database User**
   - Create a database user with read/write permissions

4. **Connection String**
   - Get connection string and add to backend environment variables

## 🧪 Testing Your Deployment

### Unit Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Load Testing

Load testing is maintained in a separate project following [Artillery's best practices](https://www.artillery.io/docs/get-started/get-artillery).

1. **Navigate to Load Testing Project**
   ```bash
   cd ../WAGmovieReviews-load-tests
   npm install
   ```

2. **Run Load Tests**
   ```bash
   # Test against local development server
   npm run test:local

   # Test against staging environment
   npm run test:staging

   # Test against production environment  
   npm run test:production

   # Generate detailed HTML report
   npm run report
   ```

3. **Stress Testing (Find Breaking Points)**
   ```bash
   npm run load-test:stress
   ```

### Manual Testing Checklist
- [ ] Health check endpoint: `GET /api/v1/health`
- [ ] User registration and login
- [ ] Movie browsing and search
- [ ] Review creation and likes
- [ ] Admin functionality
- [ ] Responsive design on mobile/tablet

## 🔧 Production Optimizations

### Frontend (Netlify)
- ✅ Automatic HTTPS
- ✅ CDN distribution
- ✅ Gzip compression
- ✅ Cache headers configured
- ✅ SPA routing with `_redirects`

### Backend (Render)
- ✅ Health checks configured
- ✅ Auto-restart on failure
- ✅ Environment-based configuration
- ✅ Rate limiting implemented
- ✅ Security headers

## 📊 Monitoring & Maintenance

### Performance Monitoring
1. **Render Dashboard**
   - Monitor CPU, memory, and response times
   - Set up alerts for downtime

2. **Netlify Analytics**
   - Track frontend performance
   - Monitor build times

### Regular Maintenance
- Monitor database usage and performance
- Review error logs regularly
- Update dependencies monthly
- Run load tests before major releases

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure `CLIENT_URL` is set correctly in backend
   - Check Netlify site URL matches exactly

2. **Environment Variables**
   - Verify all required env vars are set
   - Check for typos in variable names

3. **Build Failures**
   - Check Node.js version compatibility
   - Ensure all dependencies are listed in package.json

4. **Database Connection**
   - Verify MongoDB connection string
   - Check network access settings in MongoDB Atlas

### Load Testing Issues
- Start with basic load test before stress testing
- Monitor server resources during tests
- Adjust rate limits if needed for legitimate traffic

## 📞 Support

If you encounter issues:
1. Check the health endpoint first
2. Review application logs
3. Verify environment variables
4. Test locally with production environment variables

---

**Next Steps**: After deployment, run load tests to ensure your application can handle expected traffic! 🎯