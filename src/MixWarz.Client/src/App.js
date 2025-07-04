import React, { useEffect, Fragment, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { refreshToken, fetchUserProfile } from "./store/authSlice";
import { jwtDecode } from "jwt-decode";
import AppConfig from "./utils/AppConfig";
import { getRolesFromToken, hasAdminRole } from "./utils/authUtils";
import ScrollToTop from "./components/common/ScrollToTop";

// Layouts - Load immediately (critical for routing)
import MainLayout from "./components/layouts/MainLayout";

// Critical pages - Load immediately
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Lazy load heavy components that are not immediately needed
const AdminLayout = React.lazy(() => import("./components/layouts/AdminLayout"));

// Public Pages - Lazy loaded
const ProductsPage = React.lazy(() => import("./pages/products/ProductsPage"));
const ProductDetailPage = React.lazy(() => import("./pages/products/ProductDetailPage"));
const CartPage = React.lazy(() => import("./pages/cart/CartPage"));
const CheckoutPage = React.lazy(() => import("./pages/checkout/CheckoutPage"));
const CheckoutSuccessPage = React.lazy(() => import("./pages/checkout/CheckoutSuccessPage"));
const CheckoutCancelPage = React.lazy(() => import("./pages/checkout/CheckoutCancelPage"));
const OrderConfirmationPage = React.lazy(() => import("./pages/checkout/OrderConfirmationPage"));
const CompetitionsPage = React.lazy(() => import("./pages/competitions/CompetitionsPage"));
const CompetitionDetailPage = React.lazy(() => import("./pages/competitions/CompetitionDetailPage"));
const CompetitionResultsPage = React.lazy(() => import("./pages/competitions/CompetitionResultsPage"));
const BlogListPage = React.lazy(() => import("./pages/blog/BlogListPage"));
const BlogArticlePage = React.lazy(() => import("./pages/blog/BlogArticlePage"));
const UserProfilePage = React.lazy(() => import("./pages/profile/UserProfilePage"));
const ProfileSettingsPage = React.lazy(() => import("./pages/profile/ProfileSettingsPage"));
const PricingPage = React.lazy(() => import("./pages/PricingPage"));

// Admin Pages - Lazy loaded (heavy components)
const AdminDashboardPage = React.lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = React.lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminProductsPage = React.lazy(() => import("./pages/admin/AdminProductsPage"));
const AdminCompetitionsPage = React.lazy(() => import("./pages/admin/AdminCompetitionsPage"));
const AdminOrdersPage = React.lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminBlogPage = React.lazy(() => import("./pages/admin/AdminBlogPage"));

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
    <div className="spinner-border" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Private route wrapper
const PrivateRoute = ({ element, requiredRoles = [] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  console.log("PrivateRoute check:", {
    isAuthenticated,
    user,
    userRoles: user?.roles,
    requiredRoles,
    roleType: user?.roles ? typeof user.roles : "undefined",
    isArray: Array.isArray(user?.roles),
  });

  if (!isAuthenticated) {
    console.log("Redirecting: Not authenticated");
    return <Navigate to="/login" />;
  }

  // Enhanced role checking for different formats
  if (requiredRoles.length > 0) {
    let hasRequiredRole = false;

    // Get roles from token (including Microsoft Identity format)
    const { allRoles, msRoles, standardRoles } = getRolesFromToken() || {};

    console.log("Roles from token:", { allRoles, msRoles, standardRoles });

    // Check if user has any of the required roles in any format
    const tokenHasRole =
      hasAdminRole(allRoles, requiredRoles) ||
      hasAdminRole(msRoles, requiredRoles);

    if (tokenHasRole) {
      console.log("User has required role from token");
      hasRequiredRole = true;
    }
    // Fallback to checking roles from user object if token check failed
    else if (user?.roles) {
      hasRequiredRole = hasAdminRole(user.roles, requiredRoles);
      if (hasRequiredRole) {
        console.log("User has required role from user object");
      }
    }

    console.log("Role check result:", {
      hasRequiredRole,
      redirecting: !hasRequiredRole,
    });

    if (!hasRequiredRole) {
      return <Navigate to="/" />;
    }
  }

  return element;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Handle token refresh
  useEffect(() => {
    dispatch(refreshToken());
  }, [dispatch]);

  // Fetch user profile data after authentication
  useEffect(() => {
    if (isAuthenticated) {
      console.log("User authenticated, fetching complete profile data");
      dispatch(fetchUserProfile());
    }
  }, [isAuthenticated, dispatch]);

  return (
    <Fragment>
      {/* Include the AppConfig component for global configurations */}
      <AppConfig />
      
      {/* Scroll to top on route changes */}
      <ScrollToTop />

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route
              path="checkout"
              element={<PrivateRoute element={<CheckoutPage />} />}
            />
            <Route
              path="checkout/success"
              element={<PrivateRoute element={<CheckoutSuccessPage />} />}
            />
            <Route
              path="checkout/cancel"
              element={<PrivateRoute element={<CheckoutCancelPage />} />}
            />
            <Route
              path="order-confirmation/:id"
              element={<PrivateRoute element={<OrderConfirmationPage />} />}
            />
            <Route path="competitions" element={<CompetitionsPage />} />
            <Route path="competitions/:id" element={<CompetitionDetailPage />} />
            <Route path="competitions/:id/results" element={<CompetitionResultsPage />} />

            {/* Blog Routes */}
            <Route path="blog" element={<BlogListPage />} />
            <Route path="blog/:slug" element={<BlogArticlePage />} />

            {/* Profile Routes */}
            <Route
              path="profile"
              element={<PrivateRoute element={<UserProfilePage />} />}
            />
            <Route
              path="profile/settings"
              element={<PrivateRoute element={<ProfileSettingsPage />} />}
            />
            <Route path="profile/:username" element={<UserProfilePage />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute element={<AdminLayout />} requiredRoles={["Admin"]} />
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="competitions" element={<AdminCompetitionsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="blog" element={<AdminBlogPage />} />
          </Route>

          {/* Catch All Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Fragment>
  );
}

export default App;
