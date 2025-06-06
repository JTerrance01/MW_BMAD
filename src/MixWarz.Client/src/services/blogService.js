import apiService from "./apiService";

// Blog service with centralized API calls and proper error handling
const blogService = {
  // Get all blog articles with optional filtering
  getArticles: async (params = {}) => {
    try {
      return await apiService.get("/api/blog/articles", params, {
        errorContext: "Blog Articles",
      });
    } catch (error) {
      console.error("Error in blogService.getArticles:", error);
      // Return a fallback response for the UI
      return {
        success: false,
        message: error.message || "Failed to fetch articles",
        articles: [],
      };
    }
  },

  // Get a single article by slug
  getArticleBySlug: async (slug) => {
    try {
      return await apiService.get(
        `/api/blog/articles/${slug}`,
        {},
        {
          errorContext: `Blog Article (${slug})`,
        }
      );
    } catch (error) {
      console.error(`Error in blogService.getArticleBySlug:`, error);
      return {
        success: false,
        message: error.message || "Failed to fetch article",
        article: null,
      };
    }
  },

  // Get all blog categories
  getCategories: async () => {
    try {
      return await apiService.get(
        "/api/blog/categories",
        {},
        {
          errorContext: "Blog Categories",
        }
      );
    } catch (error) {
      console.error("Error in blogService.getCategories:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch categories",
        categories: [],
      };
    }
  },

  // Get all blog tags
  getTags: async () => {
    try {
      return await apiService.get(
        "/api/blog/tags",
        {},
        {
          errorContext: "Blog Tags",
        }
      );
    } catch (error) {
      console.error("Error in blogService.getTags:", error);
      return {
        success: false,
        message: error.message || "Failed to fetch tags",
        tags: [],
      };
    }
  },

  // Get article comments
  getComments: async (articleId) => {
    // This endpoint isn't implemented in the backend yet
    // Returning a placeholder for future implementation
    console.log(
      `Comments functionality for article ${articleId} will be implemented soon`
    );
    return {
      success: true,
      message: "Comments functionality is not yet implemented",
      comments: [],
    };
  },

  // Add a comment
  addComment: async (commentData) => {
    // This endpoint isn't implemented in the backend yet
    // Returning a placeholder for future implementation
    console.log(
      `Adding comment functionality will be implemented soon`,
      commentData
    );
    return {
      success: true,
      message: "Comment functionality is not yet implemented",
      comment: {
        id: Math.floor(Math.random() * 1000),
        content: commentData.content,
        authorName: "Current User",
        createdAt: new Date().toISOString(),
        parentCommentId: commentData.parentCommentId,
      },
    };
  },
};

export default blogService;
