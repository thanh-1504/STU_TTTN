import api from "./axios";

/**
 * Lấy danh sách nhân viên với phân trang và filter
 * @param {number} page - Trang (bắt đầu từ 1)
 * @param {number} pageSize - Số mục trên mỗi trang (default 10)
 * @param {string} role - Filter theo role (RECEPTIONIST, TECHNICIAN)
 * @param {boolean} isActive - Filter theo trạng thái
 * @returns {Promise<{users: array, total: number, page: number, pageSize: number}>}
 */
export const getStaffList = async (
  page = 1,
  pageSize = 10,
  role = null,
  isActive = null,
) => {
  try {
    const params = new URLSearchParams();
    if (role) params.append("role", role);
    if (isActive !== null) params.append("isActive", isActive);

    console.log(`📋 Fetching staff list (page ${page}, size ${pageSize})`);

    const response = await api.get(`/admin/users?${params.toString()}`);
    const users = Array.isArray(response.data)
      ? response.data.filter((user) => user.role?.roleName !== "ADMIN")
      : [];

    // Backend trả array, frontend xử lý phân trang
    const total = users.length;
    const start = (page - 1) * pageSize;
    const paginatedUsers = users.slice(start, start + pageSize);

    console.log(`✅ Got ${users.length} staff members`);

    return {
      users: paginatedUsers,
      total: total,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("❌ Error fetching staff:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết nhân viên
 * @param {number} id - ID nhân viên
 * @returns {Promise<object>}
 */
export const getStaffDetail = async (id) => {
  try {
    console.log(`📖 Fetching staff detail #${id}`);
    const response = await api.get(`/admin/users/${id}`);
    console.log(`✅ Got staff detail for #${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching staff #${id}:`, error);
    throw error;
  }
};

/**
 * Lấy thống kê nhân viên
 * @param {number} id - ID nhân viên
 * @returns {Promise<{totalOrders: number, totalRevenue: number}>}
 */
export const getStaffStats = async (id) => {
  try {
    console.log(`📊 Fetching staff stats #${id}`);
    const response = await api.get(`/admin/users/${id}/stats`);
    console.log(`✅ Got stats for #${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching stats for #${id}:`, error);
    return { totalOrders: 0, totalRevenue: 0 }; // Default values
  }
};

/**
 * Lấy thông tin nhân viên theo ID (dùng cho edit form)
 * @param {number} id - ID nhân viên
 * @returns {Promise<object>}
 */
export const getStaffById = async (id) => {
  try {
    console.log(`📖 Fetching staff #${id}`);
    const response = await api.get(`/admin/users/${id}`);
    console.log(`✅ Got staff #${id}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching staff #${id}:`, error);
    throw error;
  }
};

/**
 * Cập nhật thông tin nhân viên
 * @param {number} id - ID nhân viên
 * @param {object} data - {fullname, phone, email, roleId}
 * @returns {Promise<{success: boolean, data?: object, errors?: object}>}
 */
export const updateStaff = async (id, data) => {
  try {
    console.log(`✏️ Updating staff #${id}`);
    const response = await api.patch(`/admin/users/${id}`, data);
    console.log(`✅ Staff #${id} updated successfully`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ Error updating staff #${id}:`, error);

    const errorResponse = error.response?.data;
    const errors = {};

    if (errorResponse?.message) {
      if (Array.isArray(errorResponse.message)) {
        errorResponse.message.forEach((msg) => {
          const match = msg.match(/^([a-z]+):\s*(.+)$/i);
          if (match) {
            errors[match[1]] = match[2];
          } else {
            errors.general = msg;
          }
        });
      } else {
        errors.general = errorResponse.message;
      }
    }

    return {
      success: false,
      errors:
        Object.keys(errors).length > 0
          ? errors
          : { general: "Cập nhật nhân viên thất bại" },
    };
  }
};

/**
 * Tạo nhân viên mới
 * @param {object} data - {username, fullname, phone, email, roleId}
 * @returns {Promise<{success: boolean, data?: object, errors?: object}>}
 */
export const createStaff = async (data) => {
  try {
    console.log("➕ Creating new staff:", data.username);
    const response = await api.post("/admin/users", data);
    console.log("✅ Staff created successfully:", response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("❌ Error creating staff:", error);

    // Parse validation errors from backend
    const errorResponse = error.response?.data;
    const errors = {};

    if (errorResponse?.message) {
      // Handle both array of errors and single error message
      if (Array.isArray(errorResponse.message)) {
        errorResponse.message.forEach((msg) => {
          // Extract field name and error message
          // e.g., "field: error message" -> {field: "error message"}
          const match = msg.match(/^([a-z]+):\s*(.+)$/i);
          if (match) {
            errors[match[1]] = match[2];
          } else {
            errors.general = msg;
          }
        });
      } else {
        errors.general = errorResponse.message;
      }
    }

    return {
      success: false,
      errors:
        Object.keys(errors).length > 0
          ? errors
          : { general: "Tạo nhân viên thất bại" },
    };
  }
};

/**
 * Bật/tắt trạng thái hoạt động của nhân viên
 * @param {number} id - ID nhân viên
 * @returns {Promise<object>}
 */
export const toggleStaffActive = async (id) => {
  try {
    console.log(`🔄 Toggling staff #${id} active status`);
    const response = await api.patch(`/admin/users/${id}/toggle-active`);
    console.log(`✅ Staff #${id} status updated`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error toggling staff #${id}:`, error);
    throw error;
  }
};

/**
 * Xóa/vô hiệu hóa nhân viên
 * @param {number} id - ID nhân viên
 * @returns {Promise<object>}
 */
export const deleteStaff = async (id) => {
  // Backend không có endpoint DELETE, dùng toggle-active
  return toggleStaffActive(id);
};

/**
 * Lấy danh sách kỹ thuật viên (Public)
 * @returns {Promise<Array>}
 */
export const getPublicTechnicians = async () => {
  try {
    const response = await api.get("/public/technicians");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching public technicians:", error);
    throw error;
  }
};
