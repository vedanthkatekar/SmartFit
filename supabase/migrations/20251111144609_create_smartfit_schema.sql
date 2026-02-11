/*
  # SmartFit Database Schema

  ## Overview
  Creates the core database structure for SmartFit, a digital wardrobe and outfit planner app.

  ## Tables Created

  ### 1. profiles
  Stores user profile information and preferences
  - `id` (uuid, FK to auth.users): Primary key, links to Supabase auth
  - `email` (text): User email
  - `full_name` (text): User's full name
  - `avatar_url` (text): Profile picture URL
  - `style_preference` (text): User's style preference (casual, formal, sporty, etc.)
  - `created_at` (timestamptz): Account creation timestamp
  - `updated_at` (timestamptz): Last update timestamp

  ### 2. clothing_items
  Stores individual clothing items in user's wardrobe
  - `id` (uuid): Primary key
  - `user_id` (uuid, FK): Links to profiles
  - `name` (text): Item name/description
  - `category` (text): Type of clothing (shirt, pants, dress, shoes, etc.)
  - `color` (text): Primary color
  - `season` (text): Suitable season (spring, summer, fall, winter, all-season)
  - `image_url` (text): Photo of the clothing item
  - `brand` (text): Brand name (optional)
  - `purchase_date` (date): When item was purchased (optional)
  - `last_worn` (date): Last time item was worn
  - `times_worn` (integer): Count of times worn
  - `favorite` (boolean): User favorite flag
  - `tags` (text[]): Custom tags for filtering
  - `created_at` (timestamptz): When added to wardrobe

  ### 3. outfits
  Stores outfit combinations created by user or AI
  - `id` (uuid): Primary key
  - `user_id` (uuid, FK): Links to profiles
  - `name` (text): Outfit name
  - `occasion` (text): Event type (casual, work, formal, sports, date, etc.)
  - `season` (text): Suitable season
  - `weather_type` (text): Weather condition (sunny, rainy, cold, hot, etc.)
  - `image_url` (text): Combined outfit photo (optional)
  - `ai_generated` (boolean): Whether outfit was AI-suggested
  - `favorite` (boolean): User favorite flag
  - `times_worn` (integer): Count of times worn
  - `last_worn` (date): Last time outfit was worn
  - `created_at` (timestamptz): Creation timestamp

  ### 4. outfit_items
  Junction table linking outfits to clothing items
  - `id` (uuid): Primary key
  - `outfit_id` (uuid, FK): Links to outfits
  - `clothing_item_id` (uuid, FK): Links to clothing_items
  - `created_at` (timestamptz): Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Policies enforce user_id matching for all operations
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  avatar_url text,
  style_preference text DEFAULT 'casual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create clothing_items table
CREATE TABLE IF NOT EXISTS clothing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  color text NOT NULL,
  season text DEFAULT 'all-season',
  image_url text NOT NULL,
  brand text,
  purchase_date date,
  last_worn date,
  times_worn integer DEFAULT 0,
  favorite boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clothing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clothing items"
  ON clothing_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clothing items"
  ON clothing_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clothing items"
  ON clothing_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clothing items"
  ON clothing_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create outfits table
CREATE TABLE IF NOT EXISTS outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  occasion text DEFAULT 'casual',
  season text,
  weather_type text,
  image_url text,
  ai_generated boolean DEFAULT false,
  favorite boolean DEFAULT false,
  times_worn integer DEFAULT 0,
  last_worn date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfits"
  ON outfits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfits"
  ON outfits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own outfits"
  ON outfits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfits"
  ON outfits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create outfit_items junction table
CREATE TABLE IF NOT EXISTS outfit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id uuid NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  clothing_item_id uuid NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(outfit_id, clothing_item_id)
);

ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outfit items"
  ON outfit_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own outfit items"
  ON outfit_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own outfit items"
  ON outfit_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clothing_items_user_id ON clothing_items(user_id);
CREATE INDEX IF NOT EXISTS idx_clothing_items_category ON clothing_items(category);
CREATE INDEX IF NOT EXISTS idx_clothing_items_season ON clothing_items(season);
CREATE INDEX IF NOT EXISTS idx_outfits_user_id ON outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_clothing_item_id ON outfit_items(clothing_item_id);