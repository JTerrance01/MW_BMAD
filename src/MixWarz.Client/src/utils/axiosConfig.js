import axios from "axios";

// Base configuration for axios
const API_BASE_URL = process.env.REACT_APP_API_URL || "https://localhost:7001";

// Create instance with defaults
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Add auth token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle common response issues
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login?expired=true";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
