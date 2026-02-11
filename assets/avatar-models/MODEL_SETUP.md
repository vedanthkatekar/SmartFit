# 3D Model Setup Instructions

## Model Images Provided

You provided two high-quality 3D mannequin model images that need to be used as the base for the virtual try-on feature.

## Setup Steps

To use your 3D model images:

1. **Host the images**: Upload your model images to a hosting service:
   - **Recommended**: Use your Supabase Storage bucket
   - Alternative: Use a CDN like Cloudinary, imgbb, or AWS S3

2. **Update the database**: Run this SQL to update avatar templates:
   ```sql
   UPDATE avatar_templates
   SET base_image_url = 'YOUR_HOSTED_IMAGE_URL_HERE'
   WHERE gender = 'male' AND body_type = 'average';
   ```

3. **For local development**: Place images in this directory and reference them with:
   ```typescript
   const modelImage = require('@/assets/avatar-models/male-front.png');
   ```

## Current Status

The system is configured to use 3D model images, but they need to be properly hosted and referenced.

## File Names
- `male-front.png` - Front view of male 3D mannequin
- `male-side.png` - Side view (if available)
- `female-front.png` - Front view of female 3D mannequin (if available)
