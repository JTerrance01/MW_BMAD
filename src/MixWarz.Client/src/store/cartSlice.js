import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const cartItems = localStorage.getItem("cartItems");
    return cartItems ? JSON.parse(cartItems) : [];
  } catch (error) {
    console.error("Failed to load cart from localStorage:", error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (cartItems) => {
  try {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
};

// Create an order
export const createOrder = createAsyncThunk(
  "cart/createOrder",
  async ({ items, shippingAddress, paymentMethod }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/orders", {
        items,
        shippingAddress,
        paymentMethod,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

// Process payment
export const processPayment = createAsyncThunk(
  "cart/processPayment",
  async ({ orderId, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/api/payments/${orderId}`,
        paymentDetails
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Payment failed");
    }
  }
);

const initialState = {
  items: loadCartFromStorage(),
  loading: false,
  error: null,
  orderCreated: null,
  paymentProcessed: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.items.find((item) => item.id === newItem.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...newItem, quantity: 1 });
      }

      saveCartToStorage(state.items);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      saveCartToStorage(state.items);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((item) => item.id === id);

      if (item) {
        item.quantity = Math.max(1, quantity);
      }

      saveCartToStorage(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    },
    resetOrderState: (state) => {
      state.orderCreated = null;
      state.paymentProcessed = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order cases
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orderCreated = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Process payment cases
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.loading = false;
        state.paymentProcessed = true;
        state.items = [];
        saveCartToStorage([]);
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  resetOrderState,
} = cartSlice.actions;

export default cartSlice.reducer;
