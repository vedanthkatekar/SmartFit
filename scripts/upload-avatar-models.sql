-- ========================================
-- Upload Avatar Model Images Setup
-- ========================================

-- Step 1: Create storage bucket (run this first)
-- Go to: https://supabase.com/dashboard > Storage > Create new bucket
-- Bucket name: avatar-models
-- Make it PUBLIC (check the public checkbox)

-- Step 2: Upload your 3D model images to the bucket
-- Upload these files:
--   - male-front.png (your 3D male mannequin image)
--   - female-front.png (if you have a female model)
--   - male-side.png (optional side views)

-- Step 3: Update the avatar templates with your image URLs
-- Replace [YOUR-PROJECT-ID] with your actual Supabase project ID
-- Replace [IMAGE-NAME] with your actual uploaded image filenames

-- For MALE model:
UPDATE avatar_templates
SET base_image_url = 'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/avatar-models/male-front.png'
WHERE gender = 'male' AND body_type = 'average';

-- For FEMALE model:
UPDATE avatar_templates
SET base_image_url = 'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/avatar-models/female-front.png'
WHERE gender = 'female' AND body_type = 'average';

-- For NEUTRAL/UNSPECIFIED model:
UPDATE avatar_templates
SET base_image_url = 'https://[YOUR-PROJECT-ID].supabase.co/storage/v1/object/public/avatar-models/male-front.png'
WHERE gender = 'unspecified' AND body_type = 'average';

-- Step 4: Verify the update
SELECT gender, body_type, base_image_url
FROM avatar_templates
WHERE is_active = true;

-- ========================================
-- Alternative: Using External Hosting
-- ========================================

-- If you prefer to use ImgBB, Cloudinary, or another image host:
-- 1. Upload your images there
-- 2. Copy the direct image URLs
-- 3. Use them in the UPDATE statements above

-- Example with ImgBB:
-- UPDATE avatar_templates
-- SET base_image_url = 'https://i.ibb.co/xxxxxx/your-image.png'
-- WHERE gender = 'male' AND body_type = 'average';
