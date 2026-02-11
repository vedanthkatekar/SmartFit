/*
  # Add AI-Powered Virtual Try-On System

  This migration adds comprehensive support for AI-powered virtual try-on functionality
  where users can upload their own photos and see realistic garment visualization.

  ## New Tables
  
  ### virtual_tryon_photos
  - Stores user-uploaded full-body photos for virtual try-on
  - Tracks photo metadata, processing status, and segmentation data
  - Links to user profiles with proper RLS
  
  ### virtual_tryon_results
  - Stores generated try-on results with AI-processed images
  - Links user photo, clothing items, and generated result image
  - Tracks processing metadata and performance metrics
  - Supports before/after comparison and sharing

  ## Security
  - Enable RLS on all new tables
  - Users can only access their own photos and results
  - Authenticated users only
  
  ## Features Enabled
  1. User photo upload with metadata tracking
  2. AI processing status tracking
  3. Result caching and retrieval
  4. Before/after comparison support
  5. Share and save functionality
*/

-- Create table for user virtual try-on photos
CREATE TABLE IF NOT EXISTS virtual_tryon_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Photo storage
  photo_url text NOT NULL,
  thumbnail_url text,
  
  -- Photo metadata
  original_filename text,
  file_size_bytes integer DEFAULT 0,
  image_width integer,
  image_height integer,
  mime_type text DEFAULT 'image/jpeg',
  
  -- Processing data
  is_processed boolean DEFAULT false,
  processing_status text DEFAULT 'pending',
  segmentation_data jsonb,
  pose_data jsonb,
  body_measurements jsonb,
  
  -- User preferences
  is_primary boolean DEFAULT false,
  visibility text DEFAULT 'private',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  
  CONSTRAINT valid_processing_status CHECK (
    processing_status IN ('pending', 'processing', 'completed', 'failed')
  ),
  CONSTRAINT valid_visibility CHECK (
    visibility IN ('private', 'shared')
  )
);

-- Create table for virtual try-on results
CREATE TABLE IF NOT EXISTS virtual_tryon_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source data
  photo_id uuid REFERENCES virtual_tryon_photos(id) ON DELETE CASCADE,
  outfit_recommendation_id uuid REFERENCES outfit_recommendations(id) ON DELETE SET NULL,
  item_ids uuid[] NOT NULL,
  
  -- Result images
  result_image_url text NOT NULL,
  thumbnail_url text,
  
  -- Outfit details
  outfit_name text DEFAULT 'Virtual Try-On Outfit',
  occasion text,
  
  -- AI processing metadata
  processing_time_ms integer DEFAULT 0,
  ai_model_version text DEFAULT 'v1.0',
  processing_metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Quality metrics
  confidence_score numeric(3,2) DEFAULT 0.00,
  quality_score numeric(3,2) DEFAULT 0.00,
  
  -- User interaction
  is_favorite boolean DEFAULT false,
  is_shared boolean DEFAULT false,
  share_token text,
  view_count integer DEFAULT 0,
  
  -- User feedback
  user_rating integer,
  user_notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz,
  
  CONSTRAINT valid_user_rating CHECK (
    user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)
  )
);

-- Enable Row Level Security
ALTER TABLE virtual_tryon_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_tryon_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for virtual_tryon_photos

CREATE POLICY "Users can view own virtual try-on photos"
  ON virtual_tryon_photos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual try-on photos"
  ON virtual_tryon_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual try-on photos"
  ON virtual_tryon_photos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own virtual try-on photos"
  ON virtual_tryon_photos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for virtual_tryon_results

CREATE POLICY "Users can view own virtual try-on results"
  ON virtual_tryon_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own virtual try-on results"
  ON virtual_tryon_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtual try-on results"
  ON virtual_tryon_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own virtual try-on results"
  ON virtual_tryon_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_virtual_tryon_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_virtual_tryon_results_timestamp ON virtual_tryon_results;
CREATE TRIGGER update_virtual_tryon_results_timestamp
  BEFORE UPDATE ON virtual_tryon_results
  FOR EACH ROW
  EXECUTE FUNCTION update_virtual_tryon_results_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_virtual_tryon_photos_user_id 
  ON virtual_tryon_photos(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_virtual_tryon_photos_primary 
  ON virtual_tryon_photos(user_id) 
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_virtual_tryon_results_user_id 
  ON virtual_tryon_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_virtual_tryon_results_photo_id 
  ON virtual_tryon_results(photo_id);

CREATE INDEX IF NOT EXISTS idx_virtual_tryon_results_favorites 
  ON virtual_tryon_results(user_id) 
  WHERE is_favorite = true;