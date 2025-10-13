# SkillSync PWA Setup Guide

## Overview
SkillSync has been configured as a Progressive Web App (PWA) with persistent login functionality, allowing users to install it on their mobile devices and use it like a native app.

## Features Implemented

### 1. PWA Configuration
- **App Name**: SkillSync - Smart Learning Platform
- **Icons**: Uses existing logo192.png and logo512.png from assets
- **Theme Color**: #2563eb (blue)
- **Background Color**: #ffffff (white)
- **Display Mode**: Standalone (full-screen app experience)
- **Orientation**: Portrait-primary (optimized for mobile)

### 2. Service Worker
- **File**: `client/public/sw.js`
- **Functionality**: 
  - Caches essential resources for offline functionality
  - Serves cached content when offline
  - Automatically updates cache when new versions are available

### 3. Persistent Login System
- **Token-based Authentication**: JWT tokens stored securely in localStorage
- **Auto-redirect**: Users are automatically redirected to their role-specific dashboard on app launch
- **Session Persistence**: Login persists across browser sessions and app restarts
- **Logout Behavior**: Logout redirects to landing page and clears all stored data

### 4. Role-based Dashboard Routing
The system automatically routes users to their appropriate dashboard based on their role:

| Role | Dashboard Path |
|------|----------------|
| Admin | `/admin` |
| Instructor | `/instructor` |
| Student | `/student` |
| Admission Officer | `/admission-officer` |
| Fee Manager | `/fee-manager` |
| Hostel Manager | `/hostel-manager` |
| Exam Controller | `/exam-controller` |
| Accountant | `/accountant` |
| Registrar | `/registrar` |

## LiveKit Cloud Integration

### Environment Configuration
Update your `.env` file with your LiveKit cloud credentials:

```env
# LiveKit Configuration
LIVEKIT_URL=your_livekit_cloud_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
```

### Server Configuration
The server is already configured to use environment variables for LiveKit credentials:
- `server/routes/livekit.js` - Uses `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET`
- Token generation and room management work with cloud LiveKit instances

## Installation Instructions

### For Users (Mobile Installation)
1. **Open the app** in a mobile browser (Chrome, Safari, Edge)
2. **Look for the install prompt** or use browser menu:
   - **Chrome**: Tap the "Add to Home Screen" option in the menu
   - **Safari**: Tap the Share button, then "Add to Home Screen"
   - **Edge**: Tap the menu, then "Apps" → "Install this site as an app"
3. **Confirm installation** when prompted
4. **Launch the app** from your home screen

### For Developers
1. **Build the app**: `npm run build` in the client directory
2. **Serve the built files** using a web server that supports HTTPS (required for PWA)
3. **Test PWA features** using browser dev tools:
   - Chrome: F12 → Application tab → Manifest & Service Workers
   - Check "Add to Home Screen" functionality

## PWA Features

### Offline Functionality
- Essential app resources are cached for offline use
- Service worker handles network requests and serves cached content when offline
- App remains functional even without internet connection (limited functionality)

### App-like Experience
- **Standalone Display**: App opens in full-screen mode without browser UI
- **Custom Icons**: Uses SkillSync branding on home screen
- **Splash Screen**: Custom loading screen with SkillSync branding
- **Responsive Design**: Optimized for both mobile and desktop

### Persistent Authentication
- **Automatic Login**: Users stay logged in across sessions
- **Role-based Routing**: Automatic redirect to appropriate dashboard
- **Secure Logout**: Complete session cleanup on logout

## Technical Implementation

### Files Modified/Created
1. **`client/public/manifest.json`** - PWA manifest configuration
2. **`client/public/sw.js`** - Service worker for offline functionality
3. **`client/public/index.html`** - Added service worker registration and PWA meta tags
4. **`client/src/context/authContext.js`** - Enhanced with persistent login
5. **`client/src/App.js`** - Added loading state handling
6. **`client/src/components/ProtectedRoute.jsx`** - Enhanced with loading states
7. **`client/src/pages/Login.js`** - Simplified login flow with auto-redirect
8. **`server/env.example`** - Added LiveKit environment variables

### Authentication Flow
1. **App Launch**: Check for stored user data and token
2. **Token Verification**: Validate token with server
3. **Auto-redirect**: Route to appropriate dashboard if valid
4. **Login Process**: Store token and user data, redirect to dashboard
5. **Logout Process**: Clear all data, redirect to landing page

## Browser Support
- **Chrome**: Full PWA support
- **Safari**: Full PWA support (iOS 11.3+)
- **Edge**: Full PWA support
- **Firefox**: Basic PWA support

## Testing PWA Features

### Install Prompt
- Open app in mobile browser
- Look for install banner or use browser menu
- Verify app appears on home screen

### Offline Testing
1. Install the app
2. Open app and navigate to different pages
3. Turn off internet connection
4. Verify cached pages still load

### Authentication Testing
1. Login to the app
2. Close browser/app completely
3. Reopen app
4. Verify automatic login and dashboard redirect

## Troubleshooting

### PWA Not Installing
- Ensure HTTPS is enabled (required for PWA)
- Check browser console for service worker errors
- Verify manifest.json is accessible

### Login Issues
- Check network connectivity
- Verify server is running
- Check browser console for authentication errors

### Offline Issues
- Clear browser cache and reload
- Check service worker registration in dev tools
- Verify resources are being cached properly

## Security Considerations
- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Service worker caches sensitive data (implement proper cache strategies)
- HTTPS is required for PWA functionality
- Regular token validation with server

## Future Enhancements
- Push notifications for real-time updates
- Background sync for offline actions
- Advanced caching strategies
- Biometric authentication support
- App store distribution (TWA - Trusted Web Activity)

## Support
For issues or questions regarding PWA setup:
1. Check browser console for errors
2. Verify all environment variables are set
3. Test on different devices and browsers
4. Review service worker registration in dev tools
