/*
  # Virtual Try-On and Avatar System

  1. New Tables
    - `user_profiles`
      - Stores user profile data including gender for avatar selection
      - Body measurements for better fit visualization
    
    - `outfit_visualizations`
      - Stores generated outfit visualization data
      - Links to outfit recommendations
      - Caches rendered views for performance
    
    - `avatar_templates`
      - Pre-configured avatar templates for different body types
      - Contains positioning data for clothing mapping

  2. Enhancements
    - Add visualization metadata to outfit_recommendations

  3. Security
    - Enable RLS on all new tables
    - Users can only access their own data
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text,
  gender text DEFAULT 'unspecified',
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  body_type text DEFAULT 'average',
  avatar_preference text DEFAULT 'neutral',
  measurement_units text DEFAULT 'metric',
  preferred_view_angle text DEFAULT 'front',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Outfit Visualizations Table
CREATE TABLE IF NOT EXISTS outfit_visualizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation_id uuid REFERENCES outfit_recommendations(id) ON DELETE CASCADE,
  item_ids uuid[] NOT NULL,
  gender_model text NOT NULL,
  body_type text DEFAULT 'average',
  view_angle text DEFAULT 'front',
  visualization_data jsonb NOT NULL,
  composite_metadata jsonb,
  is_cached boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_visualizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own visualizations"
  ON outfit_visualizations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own visualizations"
  ON outfit_visualizations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own visualizations"
  ON outfit_visualizations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Avatar Templates Table (system-wide reference data)
CREATE TABLE IF NOT EXISTS avatar_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text NOT NULL,
  body_type text NOT NULL,
  base_image_url text,
  mapping_zones jsonb NOT NULL,
  default_measurements jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE avatar_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view avatar templates"
  ON avatar_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default avatar templates with mapping zones
INSERT INTO avatar_templates (name, gender, body_type, mapping_zones, default_measurements) VALUES
  (
    'Male Average Front',
    'male',
    'average',
    '{
      "head": {"top": 50, "height": 120},
      "chest": {"top": 170, "height": 180, "width": 280},
      "waist": {"top": 350, "height": 120, "width": 260},
      "legs": {"top": 470, "height": 350, "width": 240},
      "feet": {"top": 820, "height": 80, "width": 180},
      "layering": {"outer": 0, "top": 1, "bottom": 2, "shoes": 3}
    }'::jsonb,
    '{"height": 175, "chest": 95, "waist": 82, "hips": 95}'::jsonb
  ),
  (
    'Female Average Front',
    'female',
    'average',
    '{
      "head": {"top": 50, "height": 120},
      "chest": {"top": 170, "height": 160, "width": 260},
      "waist": {"top": 330, "height": 100, "width": 230},
      "legs": {"top": 430, "height": 390, "width": 220},
      "feet": {"top": 820, "height": 80, "width": 160},
      "layering": {"outer": 0, "top": 1, "bottom": 2, "shoes": 3}
    }'::jsonb,
    '{"height": 165, "chest": 88, "waist": 68, "hips": 95}'::jsonb
  ),
  (
    'Neutral Average Front',
    'unspecified',
    'average',
    '{
      "head": {"top": 50, "height": 120},
      "chest": {"top": 170, "height": 170, "width": 270},
      "waist": {"top": 340, "height": 110, "width": 245},
      "legs": {"top": 450, "height": 370, "width": 230},
      "feet": {"top": 820, "height": 80, "width": 170},
      "layering": {"outer": 0, "top": 1, "bottom": 2, "shoes": 3}
    }'::jsonb,
    '{"height": 170, "chest": 92, "waist": 75, "hips": 95}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- Add visualization support to outfit recommendations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'outfit_recommendations' AND column_name = 'has_visualization'
  ) THEN
    ALTER TABLE outfit_recommendations 
    ADD COLUMN has_visualization boolean DEFAULT false,
    ADD COLUMN visualization_id uuid REFERENCES outfit_visualizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outfit_visualizations_user ON outfit_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_visualizations_recommendation ON outfit_visualizations(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_templates_gender ON avatar_templates(gender, body_type);
