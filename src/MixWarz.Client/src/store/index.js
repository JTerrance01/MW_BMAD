import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import adminReducer from "./adminSlice";
import blogReducer from "./blogSlice";
import cartReducer from "./cartSlice";
import productReducer from "./productSlice";
import competitionReducer from "./competitionSlice";
import votingReducer from "./votingSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    admin: adminReducer,
    blog: blogReducer,
    cart: cartReducer,
    products: productReducer,
    competitions: competitionReducer,
    voting: votingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Temporarily disable serializable check for dates
    }),
});

export default store;
