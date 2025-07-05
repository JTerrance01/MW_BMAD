-- ===================================================================
-- MixWarz Performance Optimization Indexes
-- ===================================================================
-- This script creates database indexes to optimize query performance
-- for the MixWarz application based on common query patterns.
-- 
-- Apply this script to your PostgreSQL database for optimal performance.
-- ===================================================================
-- ===================================================================
-- COMPETITION INDEXES
-- ===================================================================
-- Index for filtering competitions by status (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_status ON public."Competitions"("Status");
-- Index for filtering competitions by organizer
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_organizer ON public."Competitions"("OrganizerUserId");
-- Index for filtering competitions by date ranges (active competitions)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_dates ON public."Competitions"("StartDate", "EndDate");
-- Index for filtering competitions by submission deadline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_submission_deadline ON public."Competitions"("SubmissionDeadline");
-- Index for filtering competitions by genre
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_genre ON public."Competitions"("Genre");
-- Composite index for active competitions lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_competitions_active_lookup ON public."Competitions"("Status", "StartDate", "EndDate");
-- ===================================================================
-- SUBMISSION INDEXES
-- ===================================================================
-- Index for finding submissions by competition (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_competition ON public."Submissions"("CompetitionId");
-- Index for finding submissions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user ON public."Submissions"("UserId");
-- Index for Round 1 voting eligibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_round1_eligible ON public."Submissions"("CompetitionId", "IsEligibleForRound1Voting");
-- Index for Round 2 voting eligibility
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_round2_eligible ON public."Submissions"("CompetitionId", "IsEligibleForRound2Voting");
-- Index for Round 2 advanced submissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_round2_advanced ON public."Submissions"("CompetitionId", "AdvancedToRound2");
-- Index for competition winners lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_winners ON public."Submissions"("CompetitionId", "IsWinner");
-- Index for submission rankings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_rankings ON public."Submissions"("CompetitionId", "FinalRank");
-- Index for submission status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_status ON public."Submissions"("Status");
-- Composite index for user submissions lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_competition ON public."Submissions"("UserId", "CompetitionId");
-- ===================================================================
-- SUBMISSION JUDGMENT INDEXES
-- ===================================================================
-- Index for finding judgments by competition and voting round
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_judgments_competition_round ON public."SubmissionJudgments"("CompetitionId", "VotingRound");
-- Index for finding judgments by judge
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_judgments_judge ON public."SubmissionJudgments"("JudgeId");
-- Index for finding judgments by submission
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_judgments_submission ON public."SubmissionJudgments"("SubmissionId");
-- Index for completed judgments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_judgments_completed ON public."SubmissionJudgments"("CompetitionId", "VotingRound", "IsCompleted");
-- Composite index for judge completion tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_judgments_judge_completion ON public."SubmissionJudgments"(
    "JudgeId",
    "CompetitionId",
    "VotingRound",
    "IsCompleted"
);
-- ===================================================================
-- SUBMISSION VOTE INDEXES
-- ===================================================================
-- Index for finding votes by competition and voting round
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_votes_competition_round ON public."SubmissionVotes"("CompetitionId", "VotingRound");
-- Index for finding votes by voter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_votes_voter ON public."SubmissionVotes"("VoterId");
-- Index for finding votes by submission
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_votes_submission ON public."SubmissionVotes"("SubmissionId");
-- Index for vote counting and ranking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_votes_ranking ON public."SubmissionVotes"("CompetitionId", "VotingRound", "Rank", "Points");
-- Composite index for voter participation tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_votes_voter_participation ON public."SubmissionVotes"("VoterId", "CompetitionId", "VotingRound");
-- ===================================================================
-- USER INDEXES
-- ===================================================================
-- Index for email lookups (authentication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON public."AspNetUsers"("Email");
-- Index for normalized email lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_normalized_email ON public."AspNetUsers"("NormalizedEmail");
-- Index for Stripe customer ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer ON public."AspNetUsers"("StripeCustomerId");
-- Index for registration date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_registration_date ON public."AspNetUsers"("RegistrationDate");
-- Index for last login date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_login ON public."AspNetUsers"("LastLoginDate");
-- ===================================================================
-- PRODUCT INDEXES
-- ===================================================================
-- Index for finding products by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category ON public."Products"("CategoryId");
-- Index for active products filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON public."Products"("IsActive");
-- Index for product status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status ON public."Products"("Status");
-- Index for product type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_type ON public."Products"("ProductType");
-- Index for Stripe product ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stripe_product ON public."Products"("StripeProductId");
-- Index for product creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_creation_date ON public."Products"("CreationDate");
-- Composite index for active products by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active_category ON public."Products"("IsActive", "CategoryId", "Status");
-- ===================================================================
-- ORDER INDEXES
-- ===================================================================
-- Index for finding orders by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user ON public."Orders"("UserId");
-- Index for order status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON public."Orders"("Status");
-- Index for order date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_date ON public."Orders"("OrderDate");
-- Index for Stripe payment intent lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_stripe_payment_intent ON public."Orders"("StripePaymentIntentId");
-- Index for Stripe checkout session lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_stripe_checkout_session ON public."Orders"("StripeCheckoutSessionId");
-- Index for payment date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_date ON public."Orders"("PaymentDate");
-- Composite index for user order history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_date ON public."Orders"("UserId", "OrderDate" DESC);
-- ===================================================================
-- CART INDEXES
-- ===================================================================
-- Index for finding carts by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_carts_user ON public."Carts"("UserId");
-- Index for cart items by cart
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_cart ON public."CartItems"("CartId");
-- Index for cart items by product
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_items_product ON public."CartItems"("ProductId");
-- ===================================================================
-- BLOG INDEXES
-- ===================================================================
-- Index for published blog articles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_articles_published ON public."BlogArticles"("IsPublished");
-- Index for blog articles by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_articles_category ON public."ArticleCategories"("CategoryId");
-- Index for blog articles by tag
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_articles_tag ON public."ArticleTags"("TagId");
-- Index for blog article creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_articles_creation_date ON public."BlogArticles"("CreationDate");
-- Index for blog article slugs (SEO)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_articles_slug ON public."BlogArticles"("Slug");
-- ===================================================================
-- USER ACTIVITY INDEXES
-- ===================================================================
-- Index for user activities by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user ON public."UserActivities"("UserId");
-- Index for user activities by date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_date ON public."UserActivities"("Timestamp");
-- Index for user activities by type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_type ON public."UserActivities"("ActivityType");
-- ===================================================================
-- SUBSCRIPTION INDEXES
-- ===================================================================
-- Index for finding subscriptions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user ON public."Subscriptions"("UserId");
-- Index for Stripe subscription ID lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_stripe_subscription ON public."Subscriptions"("StripeSubscriptionId");
-- Index for subscription status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status ON public."Subscriptions"("Status");
-- Index for subscription end date filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_end_date ON public."Subscriptions"("CurrentPeriodEnd");
-- ===================================================================
-- PERFORMANCE ANALYSIS QUERIES
-- ===================================================================
-- Use these queries to analyze index usage and performance:
-- Check index usage statistics
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- ORDER BY idx_tup_read DESC;
-- Check table statistics
-- SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
-- FROM pg_stat_user_tables
-- ORDER BY n_live_tup DESC;
-- Check for unused indexes
-- SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;
-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================
DO $$ BEGIN RAISE NOTICE '====================================================================';
RAISE NOTICE 'MixWarz Performance Indexes Applied Successfully!';
RAISE NOTICE '====================================================================';
RAISE NOTICE 'Total indexes created: ~50+ performance-optimized indexes';
RAISE NOTICE 'Coverage: Competitions, Submissions, Judgments, Votes, Users, Products, Orders';
RAISE NOTICE 'Optimization: Query performance improved for most common operations';
RAISE NOTICE '====================================================================';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Monitor query performance using EXPLAIN ANALYZE';
RAISE NOTICE '2. Review index usage statistics periodically';
RAISE NOTICE '3. Consider additional indexes based on specific query patterns';
RAISE NOTICE '====================================================================';
END $$;