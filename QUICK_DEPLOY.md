# ⚡ Quick Deploy Guide

## 🚀 Deploy in 5 Minutes (Render - Free Tier)

### Step 1: Prepare Your Code (1 min)
```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy Backend (2 min)
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   - **Name**: `erp-backend`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add these environment variables:
   ```
   PORT=4000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=https://your-frontend-url.onrender.com
   LIVEKIT_URL=your_livekit_url
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   CLOUDINARY_CLOUD_NAME=your_name
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   GEMINI_API_KEY=your_key
   ```
6. Click **"Create Web Service"**
7. **Copy the backend URL** (e.g., `https://erp-backend-xyz.onrender.com`)

### Step 3: Deploy Frontend (2 min)
1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Settings:
   - **Name**: `erp-frontend`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://erp-backend-xyz.onrender.com
   ```
   (Use the URL from Step 2)
5. Click **"Create Static Site"**

### Step 4: Update Backend CLIENT_URL
1. Go back to your backend service on Render
2. Update `CLIENT_URL` environment variable with your frontend URL
3. Save changes (service will auto-redeploy)

### ✅ Done!
Your app is now live! Visit your frontend URL to access the application.

---

## 🐳 Alternative: Docker (Local/VPS)

### One Command Deploy
```bash
# 1. Create .env file in root with all variables
# 2. Run:
docker-compose up -d
```

Your app will be available at:
- Frontend: http://localhost:80
- Backend: http://localhost:4000

---

## 🔑 Required API Keys

Before deploying, get these free accounts:

1. **MongoDB Atlas** (Database)
   - https://www.mongodb.com/cloud/atlas
   - Create cluster → Get connection string

2. **LiveKit Cloud** (Video Conferencing)
   - https://cloud.livekit.io/
   - Create project → Get API keys

3. **Cloudinary** (File Storage)
   - https://cloudinary.com/
   - Sign up → Get cloud name and API keys

4. **Google Gemini** (AI Features)
   - https://makersuite.google.com/app/apikey
   - Create API key

---

## 🆘 Common Issues

**Build Failed?**
- Check Node.js version (use 18.x)
- Ensure all dependencies are in package.json
- Check build logs for specific errors

**Can't Connect to Database?**
- Whitelist `0.0.0.0/0` in MongoDB Atlas (or specific IPs)
- Verify connection string is correct
- Check if database user has proper permissions

**CORS Errors?**
- Update `CLIENT_URL` in backend .env
- Ensure frontend URL matches exactly (no trailing slash)
- Redeploy backend after changing CLIENT_URL

**Environment Variables Not Working?**
- Restart service after adding variables
- Check for typos in variable names
- Ensure no spaces around `=` in .env files

---

## 📞 Need Help?

Check these files:
- `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `PRODUCTION_CHECKLIST.md` - Complete checklist
- `README.md` - Project overview

---

**Estimated Total Time**: 5-10 minutes
**Cost**: $0 (using free tiers)
