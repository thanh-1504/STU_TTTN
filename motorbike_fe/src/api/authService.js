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
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_type"); // 'staff' hoặc 'customer'
  localStorage.removeItem("user_info");
};

/**
 * Lấy token từ localStorage
 * @returns {string|null}
 */
export const getToken = () => {
  return localStorage.getItem("access_token");
};

/**
 * Lưu token và thông tin người dùng
 * @param {string} token
 * @param {string} userType - 'staff' hoặc 'customer'
 * @param {object} userInfo
 */
export const saveAuthData = (token, userType, userInfo) => {
  localStorage.setItem("access_token", token);
  localStorage.setItem("user_type", userType);
  localStorage.setItem("user_info", JSON.stringify(userInfo));
};
