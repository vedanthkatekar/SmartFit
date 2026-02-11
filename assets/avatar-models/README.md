# Avatar Model Images

This folder contains the 3D mannequin/dummy model images used as the base for Virtual Try-On.

## Add Your Model Images Here

Place your 3D model images in this folder with these names:

- `male-front.png` - Male mannequin model (front view)
- `female-front.png` - Female mannequin model (front view)
- `neutral-front.png` - Neutral/unisex mannequin model (front view)

## Image Specifications

- **Format**: PNG (transparent or dark background)
- **Dimensions**: 600x900px minimum (2:3 aspect ratio)
- **Background**: Black/dark (#1a1a1a) or transparent
- **Pose**: Standing, arms slightly away from body
- **Quality**: High resolution for best results

## Using Your Images

After adding your images here, update the paths in:
**`/components/VirtualTryOnAvatar.tsx`**

```typescript
// Change from URLs to local assets:
const MALE_MODEL_BASE = require('@/assets/avatar-models/male-front.png');
const FEMALE_MODEL_BASE = require('@/assets/avatar-models/female-front.png');
const NEUTRAL_MODEL_BASE = require('@/assets/avatar-models/neutral-front.png');
```

## Current Setup

The system is currently configured to use placeholder URLs. Replace these with your actual model images for the best experience.

Your uploaded 3D mannequin models (the gray/white human figures) are perfect for this! Simply:

1. Save them to this folder
2. Update the image paths as shown above
3. Restart the app to see your models in action

The clothing items will be intelligently overlaid on these base models with realistic positioning, layering, shadows, and depth effects.
