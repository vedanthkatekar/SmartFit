/*
  # Add 3D Model Images to Avatar Templates

  1. Updates
    - Add realistic 3D model image URLs to avatar templates
    - Update male, female, and unspecified templates with proper model images

  2. Notes
    - Using placeholder URLs that can be replaced with actual hosted images
    - Model images should be high-quality 3D renders of human bodies
*/

-- Update male avatar template with 3D model image
UPDATE avatar_templates
SET base_image_url = 'https://images.pexels.com/photos/8038018/pexels-photo-8038018.jpeg?auto=compress&cs=tinysrgb&w=400&h=800'
WHERE gender = 'male' AND body_type = 'average';

-- Update female avatar template with 3D model image
UPDATE avatar_templates
SET base_image_url = 'https://images.pexels.com/photos/8038019/pexels-photo-8038019.jpeg?auto=compress&cs=tinysrgb&w=400&h=800'
WHERE gender = 'female' AND body_type = 'average';

-- Update neutral avatar template with 3D model image
UPDATE avatar_templates
SET base_image_url = 'https://images.pexels.com/photos/8038018/pexels-photo-8038018.jpeg?auto=compress&cs=tinysrgb&w=400&h=800'
WHERE gender = 'unspecified' AND body_type = 'average';
