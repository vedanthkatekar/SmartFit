/*
  # Advanced AI-Powered Outfit Planner System

  1. New Tables
    - `user_style_preferences`
      - Stores user's detailed style preferences, color likes/dislikes, comfort settings
      - Links to user profiles
    
    - `outfit_recommendations`
      - Stores AI-generated outfit recommendations with scores
      - Tracks which items were recommended together
      - Stores confidence scores and reasoning
    
    - `outfit_feedback`
      - Captures user feedback on recommendations (worn, skipped, liked, disliked)
      - Enables learning loop for better recommendations
    
    - `styling_rules`
      - Defines color harmony rules, fabric compatibility, style coherence
      - Used by AI scoring engine
    
    - `outfit_history`
      - Tracks when specific combinations were worn
      - Prevents repetitive recommendations
    
    - `weekly_outfit_plans`
      - Stores planned outfits for the week
      - Ensures variety and rotation

  2. Enhancements to Existing Tables
    - Add fabric, fit, wear_frequency, weather_suitability to clothing_items

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
*/

-- Add new columns to clothing_items for advanced AI matching (only missing ones)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'fabric'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN fabric text DEFAULT 'cotton';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'fit'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN fit text DEFAULT 'regular';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'wear_frequency'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN wear_frequency integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clothing_items' AND column_name = 'weather_suitability'
  ) THEN
    ALTER TABLE clothing_items ADD COLUMN weather_suitability text[] DEFAULT '{any}';
  END IF;
END $$;

-- User Style Preferences Table
CREATE TABLE IF NOT EXISTS user_style_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  style_types text[] DEFAULT '{casual}',
  favorite_colors text[] DEFAULT '{}',
  disliked_colors text[] DEFAULT '{}',
  comfort_level text DEFAULT 'balanced',
  formality_preference text DEFAULT 'casual',
  pattern_preference text DEFAULT 'solids',
  fit_preference text DEFAULT 'regular',
  avoid_categories text[] DEFAULT '{}',
  preferred_brands text[] DEFAULT '{}',
  budget_conscious boolean DEFAULT false,
  sustainability_focus boolean DEFAULT false,
  mood_settings jsonb DEFAULT '{"adventurous": 5, "conservative": 5, "bold": 5}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_style_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own style preferences"
  ON user_style_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style preferences"
  ON user_style_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style preferences"
  ON user_style_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Outfit Recommendations Table
CREATE TABLE IF NOT EXISTS outfit_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  item_ids uuid[] NOT NULL,
  occasion text NOT NULL,
  weather_type text NOT NULL,
  season text NOT NULL,
  temperature_range text,
  color_harmony_score numeric(3,2) DEFAULT 0,
  fit_balance_score numeric(3,2) DEFAULT 0,
  fabric_compatibility_score numeric(3,2) DEFAULT 0,
  style_coherence_score numeric(3,2) DEFAULT 0,
  overall_score numeric(3,2) DEFAULT 0,
  confidence_level text DEFAULT 'medium',
  styling_explanation text,
  is_backup boolean DEFAULT false,
  mood_tag text,
  date_for date,
  status text DEFAULT 'suggested',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfit recommendations"
  ON outfit_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit recommendations"
  ON outfit_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfit recommendations"
  ON outfit_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfit recommendations"
  ON outfit_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Outfit Feedback Table (Learning Loop)
CREATE TABLE IF NOT EXISTS outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recommendation_id uuid REFERENCES outfit_recommendations(id) ON DELETE CASCADE,
  feedback_type text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  was_worn boolean DEFAULT false,
  skip_reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfit feedback"
  ON outfit_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit feedback"
  ON outfit_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Outfit History Table
CREATE TABLE IF NOT EXISTS outfit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_ids uuid[] NOT NULL,
  worn_date date NOT NULL,
  occasion text,
  weather_conditions jsonb,
  user_rating integer CHECK (user_rating >= 1 AND user_rating <= 5),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfit history"
  ON outfit_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit history"
  ON outfit_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Styling Rules Table (AI Knowledge Base)
CREATE TABLE IF NOT EXISTS styling_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL,
  rule_name text NOT NULL,
  description text,
  parameters jsonb NOT NULL,
  weight numeric(3,2) DEFAULT 1.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE styling_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view styling rules"
  ON styling_rules FOR SELECT
  TO authenticated
  USING (true);

-- Weekly Outfit Plans Table
CREATE TABLE IF NOT EXISTS weekly_outfit_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start_date date NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  recommendation_id uuid REFERENCES outfit_recommendations(id) ON DELETE SET NULL,
  is_confirmed boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start_date, day_of_week)
);

ALTER TABLE weekly_outfit_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly outfit plans"
  ON weekly_outfit_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly outfit plans"
  ON weekly_outfit_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly outfit plans"
  ON weekly_outfit_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly outfit plans"
  ON weekly_outfit_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default styling rules for AI engine
INSERT INTO styling_rules (rule_type, rule_name, description, parameters, weight) VALUES
  ('color_harmony', 'complementary_colors', 'Colors opposite on color wheel', '{"pairs": [["blue", "orange"], ["red", "green"], ["yellow", "purple"]]}'::jsonb, 0.9),
  ('color_harmony', 'analogous_colors', 'Colors next to each other on wheel', '{"groups": [["blue", "green"], ["red", "orange"], ["yellow", "green"]]}'::jsonb, 0.85),
  ('color_harmony', 'neutral_base', 'Neutrals work with everything', '{"neutrals": ["black", "white", "gray", "brown", "beige"]}'::jsonb, 1.0),
  ('fabric_compatibility', 'formal_fabrics', 'Formal fabrics pair well', '{"fabrics": ["silk", "wool", "cotton", "linen"]}'::jsonb, 0.8),
  ('fabric_compatibility', 'casual_fabrics', 'Casual fabrics pair well', '{"fabrics": ["denim", "cotton", "jersey", "fleece"]}'::jsonb, 0.8),
  ('fit_balance', 'proportions', 'Balance fitted and loose pieces', '{"rule": "fitted_top_loose_bottom"}'::jsonb, 0.9),
  ('style_coherence', 'formal_consistency', 'Keep formality levels consistent', '{"levels": ["formal", "business", "smart-casual", "casual", "athletic"]}'::jsonb, 0.95),
  ('weather_rules', 'temperature_guidelines', 'Temperature-appropriate clothing', '{"cold": ["jacket", "sweater"], "hot": ["shorts", "t-shirt"], "mild": ["jeans", "shirt"]}'::jsonb, 1.0)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_user_date ON outfit_recommendations(user_id, date_for);
CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_status ON outfit_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_outfit_history_user_date ON outfit_history(user_id, worn_date);
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_category ON clothing_items(user_id, category);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week ON weekly_outfit_plans(user_id, week_start_date);
