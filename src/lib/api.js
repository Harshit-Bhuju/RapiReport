import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!config || !config.retry) {
      if (config) config.retry = 0;
    }

    if (
      config &&
      config.retry < 2 &&
      (error.code === "ECONNABORTED" || !response)
    ) {
      config.retry += 1;
      return api(config);
    }

    if (response) {
      switch (response.status) {
        case 401:
          localStorage.removeItem("auth_token");
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
            toast.error("Session expired. Please login again.");
          }
          break;
        case 403:
          toast.error("Access denied");
          break;
        case 404:
          toast.error("Resource not found");
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          toast.error(response.data?.message || "Something went wrong");
      }
    } else {
      toast.error("Network error. Check your connection.");
    }

    return Promise.reject(error);
  },
);

export default api;
