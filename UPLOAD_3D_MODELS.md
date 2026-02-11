# How to Upload Your 3D Model Images

## Step 1: Upload to Supabase Storage

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** in the left sidebar
4. Create a new bucket called `avatar-models` (make it public)
5. Upload your 3D model images:
   - `male-front.png` - The front-facing male 3D mannequin
   - `male-side.png` - Side view (optional)
   - `female-front.png` - Female model (optional)

## Step 2: Get the Public URLs

After uploading, click on each image and copy the public URL. They will look like:
```
https://[your-project-id].supabase.co/storage/v1/object/public/avatar-models/male-front.png
```

## Step 3: Update the Database

Run this SQL in your Supabase SQL Editor (replace with your actual URLs):

```sql
-- Update male avatar template
UPDATE avatar_templates
SET base_image_url = 'https://[your-project-id].supabase.co/storage/v1/object/public/avatar-models/male-front.png'
WHERE gender = 'male' AND body_type = 'average';

-- Update female avatar template (if you have it)
UPDATE avatar_templates
SET base_image_url = 'https://[your-project-id].supabase.co/storage/v1/object/public/avatar-models/female-front.png'
WHERE gender = 'female' AND body_type = 'average';

-- Update neutral avatar template
UPDATE avatar_templates
SET base_image_url = 'https://[your-project-id].supabase.co/storage/v1/object/public/avatar-models/male-front.png'
WHERE gender = 'unspecified' AND body_type = 'average';
```

## Step 4: Test

1. Go to the AI Stylist tab
2. Generate an outfit
3. Click "Try On Virtually"
4. You should now see your 3D mannequin model with clothes overlaid on it!

## Quick Alternative: Use Direct Image URLs

If you've already hosted your images elsewhere (like ImgBB, Cloudinary, etc.), just use those URLs in the SQL update statements above.

## Image Requirements

- **Format**: PNG with transparent background preferred
- **Size**: 800x1600px or similar aspect ratio
- **Background**: Dark or transparent background works best
- **Pose**: Front-facing, arms slightly away from body, T-pose or neutral stance
