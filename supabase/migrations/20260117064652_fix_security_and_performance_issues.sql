/*
  # Fix Security and Performance Issues

  ## Changes Overview
  This migration addresses critical security and performance issues identified by Supabase:
  
  ### 1. Missing Foreign Key Indexes
  Adds indexes on foreign key columns to improve query performance:
  - `outfit_feedback.recommendation_id`
  - `outfit_feedback.user_id`
  - `outfit_recommendations.visualization_id`
  - `weekly_outfit_plans.recommendation_id`

  ### 2. RLS Policy Optimization
  Optimizes all RLS policies by wrapping `auth.uid()` calls with `(select auth.uid())`
  to prevent re-evaluation for each row, significantly improving query performance at scale.
  
  #### Tables Updated:
  - profiles
  - clothing_items
  - outfits
  - outfit_items
  - user_style_preferences
  - outfit_recommendations
  - outfit_feedback
  - outfit_history
  - weekly_outfit_plans
  - user_profiles
  - outfit_visualizations

  ## Security Notes
  - All policies maintain the same security boundaries
  - Only the evaluation strategy is optimized for performance
  - No changes to access control logic
*/

-- ==========================================
-- PART 1: Add Missing Foreign Key Indexes
-- ==========================================

-- Add index for outfit_feedback.recommendation_id
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_recommendation_id 
ON outfit_feedback(recommendation_id);

-- Add index for outfit_feedback.user_id
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_id 
ON outfit_feedback(user_id);

-- Add index for outfit_recommendations.visualization_id
CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_visualization_id 
ON outfit_recommendations(visualization_id);

-- Add index for weekly_outfit_plans.recommendation_id
CREATE INDEX IF NOT EXISTS idx_weekly_outfit_plans_recommendation_id 
ON weekly_outfit_plans(recommendation_id);


-- ==========================================
-- PART 2: Optimize RLS Policies
-- ==========================================

-- ============ PROFILES TABLE ============
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);


-- ============ CLOTHING_ITEMS TABLE ============
DROP POLICY IF EXISTS "Users can view own clothing items" ON clothing_items;
CREATE POLICY "Users can view own clothing items"
  ON clothing_items FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own clothing items" ON clothing_items;
CREATE POLICY "Users can insert own clothing items"
  ON clothing_items FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own clothing items" ON clothing_items;
CREATE POLICY "Users can update own clothing items"
  ON clothing_items FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own clothing items" ON clothing_items;
CREATE POLICY "Users can delete own clothing items"
  ON clothing_items FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ============ OUTFITS TABLE ============
DROP POLICY IF EXISTS "Users can view own outfits" ON outfits;
CREATE POLICY "Users can view own outfits"
  ON outfits FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own outfits" ON outfits;
CREATE POLICY "Users can insert own outfits"
  ON outfits FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own outfits" ON outfits;
CREATE POLICY "Users can update own outfits"
  ON outfits FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own outfits" ON outfits;
CREATE POLICY "Users can delete own outfits"
  ON outfits FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ============ OUTFIT_ITEMS TABLE ============
DROP POLICY IF EXISTS "Users can view own outfit items" ON outfit_items;
CREATE POLICY "Users can view own outfit items"
  ON outfit_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own outfit items" ON outfit_items;
CREATE POLICY "Users can insert own outfit items"
  ON outfit_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete own outfit items" ON outfit_items;
CREATE POLICY "Users can delete own outfit items"
  ON outfit_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
      AND outfits.user_id = (select auth.uid())
    )
  );


-- ============ USER_STYLE_PREFERENCES TABLE ============
DROP POLICY IF EXISTS "Users can view own style preferences" ON user_style_preferences;
CREATE POLICY "Users can view own style preferences"
  ON user_style_preferences FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own style preferences" ON user_style_preferences;
CREATE POLICY "Users can insert own style preferences"
  ON user_style_preferences FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own style preferences" ON user_style_preferences;
CREATE POLICY "Users can update own style preferences"
  ON user_style_preferences FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ============ OUTFIT_RECOMMENDATIONS TABLE ============
DROP POLICY IF EXISTS "Users can view own outfit recommendations" ON outfit_recommendations;
CREATE POLICY "Users can view own outfit recommendations"
  ON outfit_recommendations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own outfit recommendations" ON outfit_recommendations;
CREATE POLICY "Users can insert own outfit recommendations"
  ON outfit_recommendations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own outfit recommendations" ON outfit_recommendations;
CREATE POLICY "Users can update own outfit recommendations"
  ON outfit_recommendations FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own outfit recommendations" ON outfit_recommendations;
CREATE POLICY "Users can delete own outfit recommendations"
  ON outfit_recommendations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ============ OUTFIT_FEEDBACK TABLE ============
DROP POLICY IF EXISTS "Users can view own outfit feedback" ON outfit_feedback;
CREATE POLICY "Users can view own outfit feedback"
  ON outfit_feedback FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own outfit feedback" ON outfit_feedback;
CREATE POLICY "Users can insert own outfit feedback"
  ON outfit_feedback FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);


-- ============ OUTFIT_HISTORY TABLE ============
DROP POLICY IF EXISTS "Users can view own outfit history" ON outfit_history;
CREATE POLICY "Users can view own outfit history"
  ON outfit_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own outfit history" ON outfit_history;
CREATE POLICY "Users can insert own outfit history"
  ON outfit_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);


-- ============ WEEKLY_OUTFIT_PLANS TABLE ============
DROP POLICY IF EXISTS "Users can view own weekly outfit plans" ON weekly_outfit_plans;
CREATE POLICY "Users can view own weekly outfit plans"
  ON weekly_outfit_plans FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly outfit plans" ON weekly_outfit_plans;
CREATE POLICY "Users can insert own weekly outfit plans"
  ON weekly_outfit_plans FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own weekly outfit plans" ON weekly_outfit_plans;
CREATE POLICY "Users can update own weekly outfit plans"
  ON weekly_outfit_plans FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly outfit plans" ON weekly_outfit_plans;
CREATE POLICY "Users can delete own weekly outfit plans"
  ON weekly_outfit_plans FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- ============ USER_PROFILES TABLE ============
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);


-- ============ OUTFIT_VISUALIZATIONS TABLE ============
DROP POLICY IF EXISTS "Users can view own visualizations" ON outfit_visualizations;
CREATE POLICY "Users can view own visualizations"
  ON outfit_visualizations FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own visualizations" ON outfit_visualizations;
CREATE POLICY "Users can insert own visualizations"
  ON outfit_visualizations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own visualizations" ON outfit_visualizations;
CREATE POLICY "Users can delete own visualizations"
  ON outfit_visualizations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
