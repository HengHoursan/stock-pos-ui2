import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const api: AxiosInstance = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api").endsWith('/') 
    ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api")
    : (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api") + '/',
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if we're already trying to log in
      const isLoginRequest = error.config?.url?.includes("/authentications/login");

      if (!isLoginRequest) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Force a hard reload to the login page to clear all store states
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
