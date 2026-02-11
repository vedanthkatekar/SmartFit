# AI Background Removal Setup Guide

## Overview

SmartFit now features AI-powered background removal that automatically processes clothing images to create clean, transparent PNG files. This feature includes a beautiful scanning animation and automatic background removal.

## Features Implemented

### 1. Scanning Animation
- **Visual Effects**: Animated scan lines with gradient effects
- **Corner Brackets**: Pulsing corner indicators showing the scan area
- **Grid Overlay**: Subtle grid pattern during scanning
- **Duration**: 2-second animation cycle

### 2. Background Removal
- **Automatic Processing**: Images are automatically processed after upload/capture
- **AI-Powered**: Uses remove.bg API for professional background removal
- **Fallback**: If API is not configured, original images are used
- **Status Indicator**: "AI Processing..." badge during processing

### 3. Dual Upload Options
- **Modal Selection**: Beautiful modal with two gradient cards
- **Camera Option**: Opens native camera on iOS/Android
- **Upload Option**: Opens file picker on all platforms
- **Both workflows** trigger the AI processing automatically

---

## How It Works

### User Flow:
1. **Click Add Button**: User taps the "+" button in wardrobe header
2. **Choose Upload Method**: Modal appears with two options:
   - 📷 **Take Photo** - Opens camera (iOS/Android only)
   - 📤 **Upload Photo** - Opens file picker (all platforms)
3. **Image Selected**: User captures or selects clothing image
4. **Processing Screen**: Dedicated full-screen processing modal appears
   - Image shown with scanning animation (2 seconds)
   - Status updates: "Scanning..." → "Removing Background..."
   - Progress steps visualized (3 steps)
5. **AI Processing**: Happens automatically in background (2-4 seconds)
6. **Form Appears Automatically**: "Name Your Item" form shows when processing completes
7. **Add Details**: User names item, selects category, color, season
8. **Compare & Actions**: Toggle original/processed, download PNG
9. **Save**: Item saved to wardrobe with transparent background

### Technical Flow:
```
Upload → Processing Screen → Scan (2s) → Background Removal → Form Appears → Save
   ↓           ↓                ↓              ↓                   ↓           ↓
Select    Show Modal      Animation    Edge Function         Fill Details   Wardrobe
Image     with Steps                   + remove.bg API       Automatically
```

---

## Setup Instructions

### Option 1: With remove.bg API (Recommended)

1. **Get API Key**:
   - Go to [remove.bg](https://www.remove.bg/api)
   - Sign up for a free account (50 API calls/month free)
   - Get your API key from the dashboard

2. **Configure in Supabase**:
   - The Edge Function is already deployed
   - Add your API key as an environment variable:
     - Go to your Supabase Dashboard
     - Navigate to: Settings → Edge Functions
     - Add secret: `REMOVE_BG_API_KEY` = `your_api_key_here`

3. **That's it!** The feature is now fully functional

### Option 2: Without API (Fallback Mode)

If you don't configure the API key:
- The scanning animation will still play (great visual effect!)
- Original images will be used (no background removal)
- No errors - graceful fallback
- Users won't notice any difference except backgrounds remain

---

## Component Details

### ScanningAnimation Component
**Location**: `/components/ScanningAnimation.tsx`

**Features**:
- Animated scan line with gradient
- Pulsing corner brackets
- Grid overlay effect
- Smooth easing animations
- Fully customizable colors

**Usage**:
```typescript
<ScanningAnimation isScanning={isScanning} />
```

### Edge Function
**Name**: `remove-background`
**Location**: `supabase/functions/remove-background`

**Endpoint**:
```
POST https://[your-project].supabase.co/functions/v1/remove-background
```

**Request Body**:
```json
{
  "imageData": "data:image/png;base64,..."
}
```

**Response**:
```json
{
  "processedImage": "data:image/png;base64,..."
}
```

---

## API Pricing (remove.bg)

### Free Tier:
- 50 API calls per month
- Perfect for testing and light usage
- No credit card required

### Paid Plans:
- **Subscription**: $9/month for 500 images
- **Pay as you go**: From $0.20 per image
- **Enterprise**: Custom pricing

For a personal/student project, the free tier is usually sufficient!

---

## Troubleshooting

### Animation not showing:
- Check that `isScanning` state is being set to `true`
- Verify the component is imported correctly
- Check console for any errors

### Background not being removed:
1. Verify API key is set in Supabase
2. Check Edge Function logs in Supabase Dashboard
3. Ensure you have API credits remaining
4. Test the API directly using their playground

### Edge Function not responding:
- Check Supabase Edge Function logs
- Verify the function is deployed
- Test the endpoint with a tool like Postman
- Check CORS headers are correct

---

## Alternative APIs

If you prefer a different background removal service:

### 1. Cloudinary AI Background Removal
- Free tier: 25 credits/month
- Edit the Edge Function to use Cloudinary API

### 2. Remove.bg Competitors
- PhotoRoom API
- Slazzer API
- DeepAI Background Removal

### 3. Self-Hosted Options
- U²-Net (requires ML setup)
- BackgroundRemover Python library
- Deploy on your own server

---

## Customization

### Change Animation Colors:
Edit `/components/ScanningAnimation.tsx`:
```typescript
// Change gradient colors
colors={['#your-color-1', '#your-color-2']}

// Change border colors
borderColor: '#your-color'
```

### Change Animation Duration:
```typescript
duration: 3000, // 3 seconds instead of 2
```

### Disable Animation (keep processing):
```typescript
<ScanningAnimation isScanning={false} />
```

---

## Testing

### Test the feature:
1. Go to Wardrobe tab
2. Click upload/camera button
3. Select/capture an image with a clear background
4. Watch the scanning animation
5. Verify background is removed (if API configured)
6. Save the item and view in wardrobe

### Expected Results:
- ✅ Scanning animation plays smoothly
- ✅ "AI Processing..." badge appears
- ✅ Background is removed (or original if no API)
- ✅ Image is saved as transparent PNG
- ✅ No errors in console

---

## Performance Notes

- **Processing time**: 2-4 seconds (depending on API)
- **Animation time**: 2 seconds (consistent)
- **Image size**: Optimized automatically by remove.bg
- **Network**: Minimal data transfer (compressed images)

---

## Security

- ✅ API key stored securely in Supabase (never exposed to client)
- ✅ All API calls go through Edge Function (not directly from app)
- ✅ User authentication required (JWT verified)
- ✅ CORS properly configured
- ✅ No image data stored on remove.bg servers (per their policy)

---

## Summary

You now have a professional-grade AI background removal feature with:
- ✨ **Dual upload options** - Camera capture AND file upload
- 🎨 **Beautiful modal UI** - Gradient cards with clear options
- 📱 **Platform-aware** - Shows camera option only on iOS/Android
- 🔄 **Scanning animation** - Professional visual feedback
- 🤖 **AI background removal** - Clean transparent PNGs
- 🔒 **Secure implementation** - API keys protected, JWT verified
- 💫 **Graceful fallback** - Works without API configuration
- 🌐 **Cross-platform** - Works on web, iOS, and Android

### User Experience Highlights:
- **One Tap**: Click "+" to see upload options
- **Clear Choices**: Beautiful gradient cards for each option
- **Instant Feedback**: Scanning animation shows processing
- **Professional Results**: Clean transparent clothing images
- **No Hassle**: All platforms supported, all methods work

The feature provides a complete, polished experience from image selection to final saved item!
