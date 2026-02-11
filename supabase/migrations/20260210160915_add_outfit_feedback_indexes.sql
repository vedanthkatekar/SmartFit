/*
  # Add Outfit Feedback System Indexes

  1. Performance Improvements
    - Add index on outfit_feedback(user_id, created_at) for user feedback history queries
    - Add index on outfit_feedback(recommendation_id) for recommendation analytics
    - Add index on outfit_feedback(feedback_type) for feedback type filtering

  2. Notes
    - These indexes improve query performance for user preference tracking
    - Helps AI recommendation system analyze user feedback patterns
*/

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_created 
  ON outfit_feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_recommendation 
  ON outfit_feedback(recommendation_id) 
  WHERE recommendation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_type 
  ON outfit_feedback(feedback_type);
