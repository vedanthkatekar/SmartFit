/*
  # Remove Unused Indexes

  This migration removes unused indexes that are consuming storage space and
  slowing down write operations without providing query performance benefits.

  ## Indexes Being Removed
  
  ### clothing_items table
  - idx_clothing_items_user_id
  - idx_clothing_items_category
  - idx_clothing_items_season
  - idx_clothing_items_user_category
  
  ### outfits table
  - idx_outfits_user_id
  
  ### outfit_items table
  - idx_outfit_items_outfit_id
  - idx_outfit_items_clothing_item_id
  
  ### outfit_recommendations table
  - idx_outfit_recommendations_user_date
  - idx_outfit_recommendations_status
  - idx_outfit_recommendations_visualization_id
  
  ### outfit_history table
  - idx_outfit_history_user_date
  
  ### weekly_outfit_plans table
  - idx_weekly_plans_user_week
  - idx_weekly_outfit_plans_recommendation_id
  
  ### outfit_visualizations table
  - idx_outfit_visualizations_user
  - idx_outfit_visualizations_recommendation
  
  ### user_profiles table
  - idx_user_profiles_user
  
  ### avatar_templates table
  - idx_avatar_templates_gender
  
  ### outfit_feedback table
  - idx_outfit_feedback_recommendation_id
  - idx_outfit_feedback_user_id

  ## Benefits
  - Reduced storage consumption
  - Faster INSERT/UPDATE/DELETE operations
  - Simplified database maintenance
  
  ## Note
  Indexes can be recreated later if query patterns change and they become beneficial.
*/

-- Drop indexes on clothing_items table
DROP INDEX IF EXISTS idx_clothing_items_user_id;
DROP INDEX IF EXISTS idx_clothing_items_category;
DROP INDEX IF EXISTS idx_clothing_items_season;
DROP INDEX IF EXISTS idx_clothing_items_user_category;

-- Drop indexes on outfits table
DROP INDEX IF EXISTS idx_outfits_user_id;

-- Drop indexes on outfit_items table
DROP INDEX IF EXISTS idx_outfit_items_outfit_id;
DROP INDEX IF EXISTS idx_outfit_items_clothing_item_id;

-- Drop indexes on outfit_recommendations table
DROP INDEX IF EXISTS idx_outfit_recommendations_user_date;
DROP INDEX IF EXISTS idx_outfit_recommendations_status;
DROP INDEX IF EXISTS idx_outfit_recommendations_visualization_id;

-- Drop indexes on outfit_history table
DROP INDEX IF EXISTS idx_outfit_history_user_date;

-- Drop indexes on weekly_outfit_plans table
DROP INDEX IF EXISTS idx_weekly_plans_user_week;
DROP INDEX IF EXISTS idx_weekly_outfit_plans_recommendation_id;

-- Drop indexes on outfit_visualizations table
DROP INDEX IF EXISTS idx_outfit_visualizations_user;
DROP INDEX IF EXISTS idx_outfit_visualizations_recommendation;

-- Drop indexes on user_profiles table
DROP INDEX IF EXISTS idx_user_profiles_user;

-- Drop indexes on avatar_templates table
DROP INDEX IF EXISTS idx_avatar_templates_gender;

-- Drop indexes on outfit_feedback table
DROP INDEX IF EXISTS idx_outfit_feedback_recommendation_id;
DROP INDEX IF EXISTS idx_outfit_feedback_user_id;