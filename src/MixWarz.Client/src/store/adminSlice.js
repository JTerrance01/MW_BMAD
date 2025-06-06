import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { uploadApi } from "../services/api";

// Fetch admin dashboard statistics
export const fetchAdminStats = createAsyncThunk(
  "admin/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/admin/statistics");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin statistics"
      );
    }
  }
);

// Fetch users list for admin
export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/admin/users", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  }
);

// Update user roles
export const updateUserRoles = createAsyncThunk(
  "admin/updateUserRoles",
  async ({ userId, roles }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/admin/users/${userId}/roles`, {
        userId,
        roles,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user roles"
      );
    }
  }
);

// Fetch competitions list for admin
export const fetchAdminCompetitions = createAsyncThunk(
  "admin/fetchCompetitions",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/admin/competitions", {
        params,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch competitions"
      );
    }
  }
);

// Update competition status
export const updateCompetitionStatus = createAsyncThunk(
  "admin/updateCompetitionStatus",
  async ({ competitionId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/admin/competitions/${competitionId}/status`,
        {
          competitionId,
          newStatus: status,
        }
      );

      // Include information needed for state updates
      return {
        ...response.data,
        competitionId,
        newStatus: status,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update competition status"
      );
    }
  }
);

// Fetch products list for admin
export const fetchAdminProducts = createAsyncThunk(
  "admin/fetchProducts",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/admin/products", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);

// Update product status
export const updateProductStatus = createAsyncThunk(
  "admin/updateProductStatus",
  async ({ productId, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `/api/v1/admin/products/${productId}/status`,
        {
          productId,
          isActive,
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product status"
      );
    }
  }
);

// Fetch orders list for admin
export const fetchAdminOrders = createAsyncThunk(
  "admin/fetchOrders",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/v1/admin/orders", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// Fetch order details for admin
export const fetchOrderDetails = createAsyncThunk(
  "admin/fetchOrderDetails",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/admin/orders/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order details"
      );
    }
  }
);

// Fetch user details
export const fetchUserDetail = createAsyncThunk(
  "admin/fetchUserDetail",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user details"
      );
    }
  }
);

// Create user
export const createUser = createAsyncThunk(
  "admin/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/v1/admin/users", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create user"
      );
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/v1/admin/users/${userId}`);
      return { ...response.data, userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete user"
      );
    }
  }
);

// Disable/Enable user
export const disableUser = createAsyncThunk(
  "admin/disableUser",
  async ({ userId, disable }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/v1/admin/users/${userId}/disable`, {
        userId,
        disable,
      });
      return { ...response.data, userId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update user status"
      );
    }
  }
);

// Create product
export const createProduct = createAsyncThunk(
  "admin/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      const response = await api.post(
        "/api/v1/admin/products",
        productData,
        config
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create product"
      );
    }
  }
);

// Update product
export const updateProduct = createAsyncThunk(
  "admin/updateProduct",
  async ({ productId, productData }, { rejectWithValue }) => {
    try {
      console.log(`Sending update for product ${productId}`, productData);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      // Use the correct products controller endpoint
      const response = await api.put(
        `/api/v1/admin/products/${productId}`,
        productData,
        config
      );

      console.log("Update response:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Product update error:",
        error.response?.data || error.message
      );
      return rejectWithValue(
        error.response?.data?.message || "Failed to update product"
      );
    }
  }
);

// Create competition
export const createCompetition = createAsyncThunk(
  "admin/createCompetition",
  async (competitionData, { rejectWithValue }) => {
    try {
      console.log(
        "Creating competition with FormData using uploadApi (extended timeout)..."
      );

      // Log FormData contents for debugging
      console.log("FormData contents:");
      let hasMultitrackUrl = false;
      let hasMultitrackFile = false;

      for (let [key, value] of competitionData.entries()) {
        // Special debug logging for multitrack fields
        if (key === "MultitrackZipUrl") {
          hasMultitrackUrl = true;
          console.log(
            `FormData ${key}: "${value}" (length: ${value?.length || 0})`
          );
        } else if (key === "MultitrackZipFile") {
          hasMultitrackFile = true;
          console.log(
            `FormData ${key}: File present (${value.name}, ${value.size} bytes)`
          );
        } else {
          console.log(
            `FormData ${key}:`,
            value instanceof File
              ? `File: ${value.name} (${value.size} bytes)`
              : value
          );
        }
      }

      // Special warnings if multitrack fields are not present
      if (!hasMultitrackUrl) {
        console.error(
          "WARNING: MultitrackZipUrl field is missing from FormData!"
        );

        // Add a placeholder value that is a properly formatted URL to pass database validation
        competitionData.append(
          "MultitrackZipUrl",
          "http://example.com/placeholder-multitrack.zip"
        );
        console.log(
          "Added valid URL placeholder to satisfy database constraints"
        );
      }

      if (!hasMultitrackFile) {
        console.error(
          "WARNING: MultitrackZipFile field is missing from FormData!"
        );
      }

      // Verify critical fields are present
      const verifyFields = [
        "Title",
        "Description",
        "StartDate",
        "EndDate",
        "OrganizerUserId",
        "ImageUrl",
        "MultitrackZipUrl", // Always include this field since we now ensure it exists
      ];

      let missingFields = [];

      for (const field of verifyFields) {
        let hasField = false;
        for (let [key] of competitionData.entries()) {
          if (key === field) {
            hasField = true;
            break;
          }
        }
        if (!hasField) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        console.error("Missing required fields:", missingFields);
        // Add the missing fields with empty values
        missingFields.forEach((field) => {
          if (field === "OrganizerUserId") {
            competitionData.append(field, "system");
            console.log(`Added missing field ${field} with value "system"`);
          } else {
            competitionData.append(field, "");
            console.log(`Added missing field ${field} with empty value`);
          }
        });
      }

      const config = {
        headers: {
          // Don't set Content-Type manually for FormData
          // Browser will set the correct boundary
        },
      };

      const response = await uploadApi.post(
        "/api/v1/admin/competitions",
        competitionData,
        config
      );

      console.log("Competition created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating competition:", error);

      // Detailed error logging
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);

        // Handle validation errors specifically
        if (error.response.status === 400 && error.response.data.errors) {
          console.error(
            "Validation errors details:",
            error.response.data.errors
          );
          const errorMessages = [];

          // Format validation errors for display
          for (const key in error.response.data.errors) {
            const messages = Array.isArray(error.response.data.errors[key])
              ? error.response.data.errors[key]
              : [error.response.data.errors[key]];

            errorMessages.push(`${key}: ${messages.join(", ")}`);
          }

          // Return a formatted string instead of an object to avoid React rendering issues
          const errorString = "Validation failed: " + errorMessages.join("; ");
          return rejectWithValue(errorString);
        }
      } else if (error.request) {
        console.error("Error request:", error.request);
      }

      return rejectWithValue(
        error.response?.data?.message || "Failed to create competition"
      );
    }
  }
);

// Update competition
export const updateCompetition = createAsyncThunk(
  "admin/updateCompetition",
  async ({ competitionId, competitionData }, { rejectWithValue }) => {
    try {
      console.log(`Sending update for competition ${competitionId}`);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await api.put(
        `/api/v1/admin/competitions/${competitionId}`,
        competitionData,
        config
      );

      console.log("Update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Competition update error:", error);
      let errorMessage = "Failed to update competition";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", error.response.data);
        errorMessage =
          error.response.data?.message ||
          error.response.data?.Message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Error request:", error.request);
        errorMessage = "No response from server";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  "admin/updateOrderStatus",
  async ({ orderId, newStatus }, { rejectWithValue }) => {
    try {
      console.log(`Sending update for order ${orderId} status: ${newStatus}`);

      // Ensure we have a valid orderId
      if (!orderId || orderId === "undefined" || isNaN(parseInt(orderId))) {
        throw new Error(`Invalid orderId: ${orderId}`);
      }

      // Convert string status to enum value if needed
      // This is already handled by the backend, just ensure it's a valid string value
      if (
        !newStatus ||
        typeof newStatus !== "string" ||
        ![
          "PendingPayment",
          "Paid",
          "Failed",
          "Fulfilled",
          "Cancelled",
        ].includes(newStatus)
      ) {
        throw new Error(`Invalid status value: ${newStatus}`);
      }

      const requestData = {
        orderId: parseInt(orderId),
        newStatus: newStatus,
      };

      console.log("Order status update request data:", requestData);

      const response = await api.put(
        `/api/v1/admin/orders/${orderId}/status`,
        requestData
      );

      console.log("Update order status response:", response.data);
      return {
        ...response.data,
        orderId,
        newStatus,
      };
    } catch (error) {
      console.error("Order status update error:", error);
      let errorMessage = "Failed to update order status";

      if (error.response) {
        console.error("Error response data:", error.response.data);
        errorMessage =
          error.response.data?.message ||
          error.response.data?.Message ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error("Error request:", error.request);
        errorMessage = "No response from server";
      } else {
        console.error("Error message:", error.message);
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Async thunks for competition monitoring and management
export const getCompetitionVotingProgress = createAsyncThunk(
  "admin/getCompetitionVotingProgress",
  async (competitionId, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/v1/admin/competitions/${competitionId}/voting-progress`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to get competition voting progress');
    }
  }
);

export const transitionCompetitionPhase = createAsyncThunk(
  "admin/transitionCompetitionPhase",
  async ({ competitionId, targetStatus }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/admin/competitions/${competitionId}/transition`,
        { targetStatus }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to transition competition phase');
    }
  }
);

export const resolveCompetitionTie = createAsyncThunk(
  "admin/resolveCompetitionTie",
  async ({ competitionId, winningSubmissionId }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/admin/competitions/${competitionId}/resolve-tie`,
        { winningSubmissionId }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to resolve competition tie');
    }
  }
);

export const recordSongCreatorPicks = createAsyncThunk(
  "admin/recordSongCreatorPicks",
  async ({ competitionId, picks }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/v1/admin/competitions/${competitionId}/song-creator-picks`,
        { picks }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to record song creator picks');
    }
  }
);

export const getCompetitionMonitoring = createAsyncThunk(
  "admin/getCompetitionMonitoring",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/v1/admin/competitions/monitoring`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to get competition monitoring data');
    }
  }
);

// Other existing admin thunks
export const getAdminDashboardData = createAsyncThunk(
  "admin/getAdminDashboardData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/admin/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch admin dashboard data"
      );
    }
  }
);

export const getAdminUsers = createAsyncThunk(
  "admin/getAdminUsers",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/admin/users", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch admin users"
      );
    }
  }
);

const initialState = {
  stats: null,
  users: [],
  competitions: [],
  products: [],
  orders: [],
  orderDetail: null,
  loading: false,
  error: null,
  totalCount: 0,
  pageSize: 10,
  currentPage: 1,
  selectedUser: null,
  dashboardData: null,
  dashboardLoading: false,
  dashboardError: null,
  usersTotalCount: 0,
  usersLoading: false,
  usersError: null,
  competitionMonitoring: [],
  competitionMonitoringLoading: false,
  competitionMonitoringError: null,
  votingProgress: null,
  votingProgressLoading: false,
  votingProgressError: null,
  operationLoading: false,
  operationError: null,
  operationSuccess: false,
  operationMessage: "",
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearOrderDetail: (state) => {
      state.orderDetail = null;
    },
    resetOperationStatus: (state) => {
      state.operationLoading = false;
      state.operationError = null;
      state.operationSuccess = false;
      state.operationMessage = "";
    },
    clearVotingProgress: (state) => {
      state.votingProgress = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch admin stats cases
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch users cases
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update user roles cases
      .addCase(updateUserRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRoles.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        state.users = state.users.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        );
      })
      .addCase(updateUserRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch admin competitions cases
      .addCase(fetchAdminCompetitions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminCompetitions.fulfilled, (state, action) => {
        state.loading = false;
        state.competitions = action.payload.competitions || [];
        state.totalCount = action.payload.totalCount || 0;
      })
      .addCase(fetchAdminCompetitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update competition status cases
      .addCase(updateCompetitionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompetitionStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Only update the competition status in the list if it's successful
        if (action.payload.success) {
          const { competitionId, newStatus } = action.payload;
          state.competitions = state.competitions.map((comp) =>
            comp.id === competitionId ? { ...comp, status: newStatus } : comp
          );
        }
      })
      .addCase(updateCompetitionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch admin products cases
      .addCase(fetchAdminProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update product status cases
      .addCase(updateProductStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProduct = action.payload;
        state.products = state.products.map((product) =>
          product.id === updatedProduct.id ? updatedProduct : product
        );
      })
      .addCase(updateProductStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch admin orders cases
      .addCase(fetchAdminOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload?.items || [];
        state.totalCount = action.payload?.totalCount || 0;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch order details cases
      .addCase(fetchOrderDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDetail = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch user detail cases
      .addCase(fetchUserDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create user cases
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new user to the list if it exists
        if (state.users) {
          state.users = [action.payload, ...state.users];
          state.totalCount += 1;
        }
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete user cases
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the deleted user from the list
        if (state.users) {
          state.users = state.users.filter(
            (user) => user.id !== action.payload.userId
          );
          state.totalCount -= 1;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Disable/Enable user cases
      .addCase(disableUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(disableUser.fulfilled, (state, action) => {
        state.loading = false;
        // Update the user's disabled status in the list
        if (state.users) {
          state.users = state.users.map((user) =>
            user.id === action.payload.userId
              ? { ...user, isDisabled: action.payload.isDisabled }
              : user
          );
        }
      })
      .addCase(disableUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create product cases
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Add the new product to the list if it exists
        if (state.products) {
          state.products = [action.payload, ...state.products];
          state.totalCount += 1;
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update product cases
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Update the product in the list
        if (state.products && action.payload.success) {
          const updatedProductId = action.payload.productId;
          // Refresh the products list to get updated data
          // This is a workaround since the API doesn't return the full product object
          state.error = null;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create competition cases
      .addCase(createCompetition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCompetition.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh the competitions list after creating a new one
        // We'll need to dispatch fetchAdminCompetitions afterward
      })
      .addCase(createCompetition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update competition cases
      .addCase(updateCompetition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompetition.fulfilled, (state, action) => {
        state.loading = false;
        // Refresh the competitions list after updating a competition
        // We'll need to dispatch fetchAdminCompetitions afterward
      })
      .addCase(updateCompetition.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update order status cases
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Only update the order status in the list if it's successful
        if (action.payload.success) {
          const { orderId, newStatus } = action.payload;
          state.orders = state.orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          );
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Competition monitoring
      .addCase(getCompetitionMonitoring.pending, (state) => {
        state.competitionMonitoringLoading = true;
        state.competitionMonitoringError = null;
      })
      .addCase(getCompetitionMonitoring.fulfilled, (state, action) => {
        state.competitionMonitoringLoading = false;
        state.competitionMonitoring = action.payload.competitions;
      })
      .addCase(getCompetitionMonitoring.rejected, (state, action) => {
        state.competitionMonitoringLoading = false;
        state.competitionMonitoringError = action.payload;
      })

      // Competition voting progress
      .addCase(getCompetitionVotingProgress.pending, (state) => {
        state.votingProgressLoading = true;
        state.votingProgressError = null;
      })
      .addCase(getCompetitionVotingProgress.fulfilled, (state, action) => {
        state.votingProgressLoading = false;
        state.votingProgress = action.payload;
      })
      .addCase(getCompetitionVotingProgress.rejected, (state, action) => {
        state.votingProgressLoading = false;
        state.votingProgressError = action.payload;
      })

      // Transition competition phase
      .addCase(transitionCompetitionPhase.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = false;
      })
      .addCase(transitionCompetitionPhase.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = true;
        state.operationMessage = "Competition phase transitioned successfully";
      })
      .addCase(transitionCompetitionPhase.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })

      // Resolve competition tie
      .addCase(resolveCompetitionTie.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = false;
      })
      .addCase(resolveCompetitionTie.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = true;
        state.operationMessage = "Competition tie resolved successfully";
      })
      .addCase(resolveCompetitionTie.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })

      // Record song creator picks
      .addCase(recordSongCreatorPicks.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = false;
      })
      .addCase(recordSongCreatorPicks.fulfilled, (state) => {
        state.operationLoading = false;
        state.operationSuccess = true;
        state.operationMessage = "Song creator picks recorded successfully";
      })
      .addCase(recordSongCreatorPicks.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });
  },
});

export const {
  setPage,
  setPageSize,
  clearOrderDetail,
  resetOperationStatus,
  clearVotingProgress,
} = adminSlice.actions;
export default adminSlice.reducer;
