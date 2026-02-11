/*
  # Update Avatar Templates with 3D Model Image URLs

  1. Changes
    - Add base model image URLs to existing avatar templates
    - These URLs point to realistic 3D mannequin models for virtual try-on
    - Supports male, female, and neutral body models

  2. Notes
    - Uses placeholder Pexels URLs that should be replaced with actual model images
    - Model images should be stored in project assets or CDN
    - Dark background (#1a1a1a) provides best contrast for clothing overlay
*/

-- Update existing avatar templates with base model image URLs
UPDATE avatar_templates
SET base_image_url = 'https://images.pexels.com/photos/14653174/pexels-photo-14653174.png'
WHERE gender = 'male' AND body_type = 'average';

UPDATE avatar_templates
SET base_image_url = 'https://images.pexels.com/photos/14653175/pexels-photo-14653175.png'
WHERE gender = 'female' AND body_type = 'average';

UPDATE avatar_templates
SET base_image_url = 'https://images.pexels.com/photos/14653174/pexels-photo-14653174.png'
WHERE gender = 'unspecified' AND body_type = 'average';
