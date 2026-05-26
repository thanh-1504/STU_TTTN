import api from "./axios";

// ────────────────────────────────────────────────────────────────────
// ADMIN / STAFF LOGIN
// ────────────────────────────────────────────────────────────────────

/**
 * Đăng nhập nhân viên (Admin/Receptionist/Technician)
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{accessToken: string, user: object}>}
 */
export const loginStaff = async (username, password) => {
  try {
    console.log("🔐 Logging in with:", { username });
    const response = await api.post("/auth/login", {
      username,
      password,
    });
    console.log("✅ Login successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Login error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

/**
 * Lấy thông tin nhân viên hiện tại (protected)
 * @returns {Promise<object>}
 */
export const getStaffMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

// ────────────────────────────────────────────────────────────────────
// CUSTOMER OTP
// ────────────────────────────────────────────────────────────────────

/**
 * Gửi OTP đến số điện thoại khách hàng
 * @param {string} phone
 * @param {string} [customerName]
 * @returns {Promise<{message: string}>}
 */
export const sendOtp = async (phone, customerName) => {
  const response = await api.post("/auth/otp/send", {
    phone,
    ...(customerName && { customerName }),
  });
  return response.data;
};

/**
 * Xác thực OTP và đăng nhập khách hàng
 * @param {string} phone
 * @param {string} otp
 * @returns {Promise<{accessToken: string, customer: object}>}
 */
export const verifyOtp = async (phone, otp) => {
  const response = await api.post("/auth/otp/verify", {
    phone,
    otp,
  });
  return response.data;
};

/**
 * Lấy thông tin khách hàng hiện tại (protected)
 * @returns {Promise<object>}
 */
export const getCustomerMe = async () => {
  const response = await api.get("/auth/customer/me");
  return response.data;
};

/**
 * Logout - xóa token khỏi localStorage
 */
export const logout = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("customer_token");
  localStorage.removeItem("access_token"); // legacy cleanup
  localStorage.removeItem("user_type");
  localStorage.removeItem("user_info");
};

/**
 * Lấy token từ localStorage
 * @param {'staff'|'customer'} [userType] - optional, defaults to reading user_type
 * @returns {string|null}
 */
export const getToken = (userType) => {
  const type = userType || localStorage.getItem("user_type");
  if (type === "staff") return localStorage.getItem("admin_token");
  if (type === "customer") return localStorage.getItem("customer_token");
  return localStorage.getItem("access_token"); // legacy fallback
};

/**
 * Lưu token và thông tin người dùng
 * @param {string} token
 * @param {'staff'|'customer'} userType
 * @param {object} userInfo
 */
export const saveAuthData = (token, userType, userInfo) => {
  // Store in the correct per-role key so tokens never collide
  if (userType === "staff") {
    localStorage.setItem("admin_token", token);
  } else {
    localStorage.setItem("customer_token", token);
  }
  // Keep a legacy key for any code that still reads access_token directly
  localStorage.setItem("access_token", token);
  localStorage.setItem("user_type", userType);
  localStorage.setItem("user_info", JSON.stringify(userInfo));
};
