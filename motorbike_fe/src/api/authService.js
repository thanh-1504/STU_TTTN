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
    const response = await api.post("/auth/login", { username, password });
    return response.data;
  } catch (error) {
    console.error("❌ Login error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
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
// CUSTOMER — EMAIL / PASSWORD
// ────────────────────────────────────────────────────────────────────

/**
 * Đăng ký tài khoản khách hàng bằng email + password
 * @param {{ email: string, password: string, customerName: string, phone: string, notificationEmail?: string }} data
 * @returns {Promise<{accessToken: string, customer: object}>}
 */
export const customerRegister = async ({ email, password, customerName, phone, notificationEmail }) => {
  const response = await api.post("/auth/customer/register", {
    email,
    password,
    customerName,
    phone,
    ...(notificationEmail ? { notificationEmail } : {}),
  });
  return response.data;
};

/**
 * Đăng nhập khách hàng bằng email + password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{accessToken: string, customer: object}>}
 */
export const customerLogin = async (email, password) => {
  const response = await api.post("/auth/customer/login", { email, password });
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

// ────────────────────────────────────────────────────────────────────
// CUSTOMER OTP (giữ lại backward-compat, không dùng nữa ở UI)
// ────────────────────────────────────────────────────────────────────

export const sendOtp = async (phone, customerName) => {
  const response = await api.post("/auth/otp/send", {
    phone,
    ...(customerName && { customerName }),
  });
  return response.data;
};

export const verifyOtp = async (phone, otp) => {
  const response = await api.post("/auth/otp/verify", { phone, otp });
  return response.data;
};

// ────────────────────────────────────────────────────────────────────
// SHARED UTILS
// ────────────────────────────────────────────────────────────────────

/**
 * Logout - xóa token khỏi localStorage
 */
export const logout = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("customer_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_type");
  localStorage.removeItem("user_info");
};

/**
 * Lấy token từ localStorage
 * @param {'staff'|'customer'} [userType]
 * @returns {string|null}
 */
export const getToken = (userType) => {
  const type = userType || localStorage.getItem("user_type");
  if (type === "staff") return localStorage.getItem("admin_token");
  if (type === "customer") return localStorage.getItem("customer_token");
  return localStorage.getItem("access_token");
};

/**
 * Lưu token và thông tin người dùng
 * @param {string} token
 * @param {'staff'|'customer'} userType
 * @param {object} userInfo
 */
export const saveAuthData = (token, userType, userInfo) => {
  if (userType === "staff") {
    localStorage.setItem("admin_token", token);
  } else {
    localStorage.setItem("customer_token", token);
  }
  localStorage.setItem("access_token", token);
  localStorage.setItem("user_type", userType);
  localStorage.setItem("user_info", JSON.stringify(userInfo));
};
