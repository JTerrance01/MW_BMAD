import * as activityTracker from "./activityTracker";

/**
 * Utility for testing and diagnosing activity tracking functionality
 */
const testActivityTracker = {
  /**
   * Test tracking different activity types
   * @returns {Promise<Object>} Results of the tests
   */
  runTests: async () => {
    console.log("🧪 Running activity tracking tests...");
    const results = {
      success: [],
      failures: [],
    };

    try {
      // Test 1: Page view
      console.log("Test 1: Tracking page view...");
      await testActivityTracker.testTrackPageView(results);

      // Test 2: Profile update
      console.log("Test 2: Tracking profile update...");
      await testActivityTracker.testTrackProfileUpdate(results);

      // Test 3: Blog article view
      console.log("Test 3: Tracking blog article view...");
      await testActivityTracker.testTrackBlogArticleView(results);

      // Test 4: Product view
      console.log("Test 4: Tracking product view...");
      await testActivityTracker.testTrackProductView(results);

      // Test 5: Competition view
      console.log("Test 5: Tracking competition view...");
      await testActivityTracker.testTrackCompetitionView(results);

      return results;
    } catch (error) {
      console.error("❌ Test suite error:", error);
      results.failures.push({
        test: "Test suite",
        error: error.message,
      });
      return results;
    }
  },

  /**
   * Test tracking page view
   * @param {Object} results - Results object to update
   */
  testTrackPageView: async (results) => {
    try {
      const activityId = await activityTracker.trackPageView("Test Page");
      results.success.push({
        test: "Page View",
        activityId,
      });
      console.log("✅ Page view tracking successful:", activityId);
      return activityId;
    } catch (error) {
      results.failures.push({
        test: "Page View",
        error: error.message,
      });
      console.error("❌ Page view tracking failed:", error);
    }
  },

  /**
   * Test tracking profile update
   * @param {Object} results - Results object to update
   */
  testTrackProfileUpdate: async (results) => {
    try {
      const activityId = await activityTracker.trackProfileUpdate("bio");
      results.success.push({
        test: "Profile Update",
        activityId,
      });
      console.log("✅ Profile update tracking successful:", activityId);
      return activityId;
    } catch (error) {
      results.failures.push({
        test: "Profile Update",
        error: error.message,
      });
      console.error("❌ Profile update tracking failed:", error);
    }
  },

  /**
   * Test tracking blog article view
   * @param {Object} results - Results object to update
   */
  testTrackBlogArticleView: async (results) => {
    try {
      const activityId = await activityTracker.trackBlogArticleView(
        1,
        "Test Article"
      );
      results.success.push({
        test: "Blog Article View",
        activityId,
      });
      console.log("✅ Blog article view tracking successful:", activityId);
      return activityId;
    } catch (error) {
      results.failures.push({
        test: "Blog Article View",
        error: error.message,
      });
      console.error("❌ Blog article view tracking failed:", error);
    }
  },

  /**
   * Test tracking product view
   * @param {Object} results - Results object to update
   */
  testTrackProductView: async (results) => {
    try {
      const activityId = await activityTracker.trackProductView(
        1,
        "Test Product"
      );
      results.success.push({
        test: "Product View",
        activityId,
      });
      console.log("✅ Product view tracking successful:", activityId);
      return activityId;
    } catch (error) {
      results.failures.push({
        test: "Product View",
        error: error.message,
      });
      console.error("❌ Product view tracking failed:", error);
    }
  },

  /**
   * Test tracking competition view
   * @param {Object} results - Results object to update
   */
  testTrackCompetitionView: async (results) => {
    try {
      const activityId = await activityTracker.trackCompetitionView(
        1,
        "Test Competition"
      );
      results.success.push({
        test: "Competition View",
        activityId,
      });
      console.log("✅ Competition view tracking successful:", activityId);
      return activityId;
    } catch (error) {
      results.failures.push({
        test: "Competition View",
        error: error.message,
      });
      console.error("❌ Competition view tracking failed:", error);
    }
  },
};

export default testActivityTracker;
