import axios from "axios";

const API_URL = "https://stu-tttn.onrender.com";
// const API_URL = "http://localhost:3000";
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: tự động gắn token theo loại tài khoản
api.interceptors.request.use((config) => {
  const staffPrefixes = ["/admin", "/receptionist", "/technician", "/system-config"];
  const isStaffRoute =
    staffPrefixes.some((prefix) => config.url?.startsWith(prefix)) ||
    config.url?.startsWith("/auth/login") ||
    config.url?.startsWith("/auth/me");
  const userType = localStorage.getItem("user_type");
  const token = userType === "staff" || isStaffRoute
    ? localStorage.getItem("admin_token")
    : localStorage.getItem("customer_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`📡 ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Interceptor: xử lý lỗi 401 tập trung
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // if (error.response?.status === 401) {
    //   localStorage.removeItem('access_token');
    //   window.location.href = '/admin/login';
    // }
    return Promise.reject(error);
  },
);

export default api;
