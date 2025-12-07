# 🚀 Deployment Guide - ERP Student Management System

## 📋 Pre-Deployment Checklist

### ✅ Required Services
- [ ] MongoDB Atlas account (or MongoDB instance)
- [ ] LiveKit Cloud account (for video conferencing)
- [ ] Cloudinary account (for file uploads)
- [ ] Google Gemini API key (for AI features)
- [ ] Hosting platform account (Render, Railway, Vercel, etc.)

---

## 🔧 Environment Configuration

### Backend (.env)
Create `server/.env` with the following variables:
```env
PORT=4000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend (.env)
Create `client/.env` with:
```env
REACT_APP_API_URL=https://your-backend-url.com
```

---

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free Tier Available)

#### Backend Deployment
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: erp-backend
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add Environment Variables from your `.env` file
6. Click "Create Web Service"
7. Copy the deployed URL (e.g., `https://erp-backend.onrender.com`)

#### Frontend Deployment
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: erp-frontend
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add Environment Variable:
   - `REACT_APP_API_URL` = Your backend URL from step 7 above
5. Click "Create Static Site"

### Option 2: Railway

#### Backend
1. Go to [Railway](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add a new service → Select `server` directory
5. Add environment variables
6. Deploy

#### Frontend
1. Add another service → Select `client` directory
2. Set build command: `npm run build`
3. Set start command: `npx serve -s build -l $PORT`
4. Add `REACT_APP_API_URL` environment variable
5. Deploy

### Option 3: Vercel (Frontend) + Render (Backend)

#### Backend on Render
Follow "Option 1: Backend Deployment" steps above

#### Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add Environment Variable:
   - `REACT_APP_API_URL` = Your backend URL
6. Click "Deploy"

---

## 🐳 Docker Deployment (Optional)

### Docker Compose Setup
```yaml
version: '3.8'

services:
  backend:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - MONGO_URI=${MONGO_URI}
      - JWT_SECRET=${JWT_SECRET}
      - LIVEKIT_URL=${LIVEKIT_URL}
      - LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
      - LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
      - CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
      - CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
      - CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    restart: unless-stopped

  frontend:
    build: ./client
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:4000
    depends_on:
      - backend
    restart: unless-stopped
```

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use environment variables for all sensitive data
- [ ] Enable CORS only for your frontend domain
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Remove console.logs from production code
- [ ] Set up rate limiting on API endpoints
- [ ] Validate all user inputs

---

## 📊 Post-Deployment Steps

1. **Test All Features**
   - User authentication (all roles)
   - File uploads (Cloudinary)
   - Video conferencing (LiveKit)
   - Database operations
   - Real-time features (Socket.io)

2. **Monitor Performance**
   - Check server logs
   - Monitor database connections
   - Track API response times
   - Monitor error rates

3. **Set Up Monitoring** (Optional)
   - Use services like Sentry for error tracking
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure log aggregation

4. **Create Admin User**
   - Use the provided scripts to create initial users
   - Test login with different roles

---

## 🛠️ Troubleshooting

### Common Issues

**CORS Errors**
- Ensure backend CORS is configured to allow your frontend domain
- Check `app.js` CORS settings

**Database Connection Failed**
- Verify MongoDB URI is correct
- Check if IP is whitelisted in MongoDB Atlas
- Ensure network access is configured

**Environment Variables Not Loading**
- Restart the service after adding variables
- Check variable names match exactly
- Ensure no trailing spaces in values

**Build Failures**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Review build logs for specific errors

---

## 📞 Support

For issues or questions:
- Check the main README.md
- Review API_DOCUMENTATION.md
- Check server logs for errors

---

## 🎉 Success!

Your ERP system should now be live and accessible. Share the frontend URL with your users and start managing your institution efficiently!
