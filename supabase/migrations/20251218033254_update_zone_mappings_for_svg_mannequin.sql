/*
  # Update Zone Mappings for SVG Mannequin Model

  1. Changes
    - Update mapping zones to match the new SVG-based 3D mannequin proportions
    - Adjust chest, waist, legs, and feet coordinates for accurate clothing overlay
    - Separate proportions for male, female, and neutral models

  2. Notes
    - Zone coordinates are calculated based on container height ratio
    - Head: 8% from top
    - Chest: 17% to 35% (torso area)
    - Waist: 35% to 48% (hip area)
    - Legs: 48% to 92%
    - Feet: 94%
*/

-- Update male avatar template zones
UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{chest}',
  '{"top": 102, "width": 110, "height": 108}'::jsonb
)
WHERE gender = 'male' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{waist}',
  '{"top": 210, "width": 95, "height": 78}'::jsonb
)
WHERE gender = 'male' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{legs}',
  '{"top": 288, "width": 90, "height": 264}'::jsonb
)
WHERE gender = 'male' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{feet}',
  '{"top": 552, "width": 70, "height": 48}'::jsonb
)
WHERE gender = 'male' AND body_type = 'average';

-- Update female avatar template zones
UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{chest}',
  '{"top": 102, "width": 90, "height": 108}'::jsonb
)
WHERE gender = 'female' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{waist}',
  '{"top": 210, "width": 95, "height": 78}'::jsonb
)
WHERE gender = 'female' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{legs}',
  '{"top": 288, "width": 85, "height": 264}'::jsonb
)
WHERE gender = 'female' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{feet}',
  '{"top": 552, "width": 65, "height": 48}'::jsonb
)
WHERE gender = 'female' AND body_type = 'average';

-- Update neutral avatar template zones
UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{chest}',
  '{"top": 102, "width": 100, "height": 108}'::jsonb
)
WHERE gender = 'unspecified' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{waist}',
  '{"top": 210, "width": 92, "height": 78}'::jsonb
)
WHERE gender = 'unspecified' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{legs}',
  '{"top": 288, "width": 88, "height": 264}'::jsonb
)
WHERE gender = 'unspecified' AND body_type = 'average';

UPDATE avatar_templates
SET mapping_zones = jsonb_set(
  mapping_zones,
  '{feet}',
  '{"top": 552, "width": 68, "height": 48}'::jsonb
)
WHERE gender = 'unspecified' AND body_type = 'average';
