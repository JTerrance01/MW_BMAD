import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Get all products
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params, { rejectWithValue }) => {
    try {
      console.log("Fetching products with params:", params);
      const response = await api.get("/api/products", { params });
      console.log("Raw Products API response:", response);
      console.log("Products API response data:", response.data);

      // Default values in case of unexpected response format
      let items = [];
      let totalCount = 0;

      // Function to extract products from any response format
      const extractProducts = (data) => {
        console.log("Extracting products from:", data);

        // Check if the data is directly an array of products
        if (Array.isArray(data)) {
          console.log("Direct array detected with", data.length, "products");
          return {
            items: data,
            totalCount: data.length,
          };
        }

        // Check if data is an object with a known property containing products
        if (data && typeof data === "object") {
          // First check for standard response format from our API (ProductsListVm)
          if (data.products && Array.isArray(data.products)) {
            console.log(
              `Found products in 'products' property with`,
              data.products.length,
              "products"
            );
            return {
              items: data.products,
              totalCount: data.totalCount || data.products.length,
            };
          }

          // Check alternative property names
          const possibleProductsProps = ["items", "data", "results", "content"];

          // Log all root keys to help diagnose
          console.log("Response object keys:", Object.keys(data));

          // Try each possible property name
          for (const prop of possibleProductsProps) {
            if (data[prop] && Array.isArray(data[prop])) {
              console.log(
                `Found products in '${prop}' property with`,
                data[prop].length,
                "products"
              );
              return {
                items: data[prop],
                totalCount: data.totalCount || data.total || data[prop].length,
              };
            }
          }

          // Fallback: Handle legacy or non-standard formats
          // If we have totalCount but no obvious items array
          if (
            data.totalCount !== undefined &&
            typeof data.totalCount === "number"
          ) {
            // Look for any array property in the object
            for (const key in data) {
              if (Array.isArray(data[key])) {
                console.log(`Found array in '${key}' property as fallback`);
                return {
                  items: data[key],
                  totalCount: data.totalCount,
                };
              }
            }
          }

          // Direct examination of the object structure
          console.log("Detailed inspection of response object:");
          for (const key in data) {
            const value = data[key];
            console.log(
              `Key: ${key}, Type: ${typeof value}, Is Array: ${Array.isArray(
                value
              )}`
            );
            if (Array.isArray(value) && value.length > 0) {
              console.log(`First item in ${key}:`, value[0]);
            }
          }
        }

        // Return a safe default if no transformation was possible
        console.warn(
          "Could not extract products from response, using safe defaults"
        );
        return { items: [], totalCount: 0 };
      };

      // Process the response data
      const result = extractProducts(response.data);
      console.log("Extracted product data:", result);

      // Ensure we always return a valid object with items and totalCount
      return {
        items: result.items || [],
        totalCount: result.totalCount || 0,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);

// Get product by ID
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      if (!id) {
        console.error("fetchProductById called without an ID");
        return rejectWithValue("No product ID provided");
      }

      console.log(`Fetching product with ID: ${id}`);
      const response = await api.get(`/api/products/${id}`);
      console.log("Product detail API response:", response.data);

      if (!response.data) {
        console.warn(`Product with ID ${id} returned empty data`);
        return rejectWithValue("Product not found");
      }

      // Ensure we have a valid product object
      if (typeof response.data !== "object" || !response.data.id) {
        console.warn(
          `Invalid product data format for ID ${id}:`,
          response.data
        );
        // Try to normalize the response if possible
        if (response.data.product) {
          console.log("Found product data in 'product' property");
          return response.data.product;
        }
        return response.data; // Return as-is as a fallback
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      return rejectWithValue(
        error.response?.data?.message || `Failed to fetch product (ID: ${id})`
      );
    }
  }
);

// Get product categories
export const fetchCategories = createAsyncThunk(
  "products/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching product categories");
      const response = await api.get("/api/products/categories");
      console.log("Categories API response:", response.data);

      // Check if response has the expected structure
      if (response.data && response.data.categories) {
        return response.data.categories;
      } else if (Array.isArray(response.data)) {
        // Handle case where API might return an array directly
        return response.data;
      } else {
        console.error("Unexpected categories response format:", response.data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

// Get product download URL
export const fetchProductDownloadUrl = createAsyncThunk(
  "products/fetchProductDownloadUrl",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/products/${productId}/download`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch download URL"
      );
    }
  }
);

const initialState = {
  products: [],
  product: null,
  categories: [],
  downloadUrl: null,
  loading: false,
  error: null,
  totalCount: 0,
  pageSize: 10,
  currentPage: 1,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
    },
    clearProductDetail: (state) => {
      state.product = null;
    },
    clearDownloadUrl: (state) => {
      state.downloadUrl = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products cases
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        console.log("Processing products response in reducer:", action.payload);

        // Now we have a consistent format from our thunk action
        if (action.payload) {
          // Get products from items array
          state.products = action.payload.items || [];
          // Get totalCount
          state.totalCount = action.payload.totalCount || 0;

          console.log(
            `Set ${state.products.length} products (total count: ${state.totalCount})`
          );
        } else {
          // Fallback in case of unexpected payload
          console.error("Unexpected products response format:", action.payload);
          state.products = [];
          state.totalCount = 0;
        }

        // Always log the result for debugging
        console.log("Products in state:", state.products);
      })

      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch product by ID cases
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch categories cases
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure categories is always an array
        state.categories = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Initialize with empty array on error
        state.categories = [];
      })

      // Fetch download URL cases
      .addCase(fetchProductDownloadUrl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDownloadUrl.fulfilled, (state, action) => {
        state.loading = false;
        state.downloadUrl = action.payload.downloadUrl;
      })
      .addCase(fetchProductDownloadUrl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setPage, setPageSize, clearProductDetail, clearDownloadUrl } =
  productSlice.actions;

export default productSlice.reducer;
