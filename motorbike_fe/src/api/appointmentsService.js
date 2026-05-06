import api from "./axios";

// ────────────────────────────────────────────────────────────────────
// PUBLIC: GET Available Slots
// ────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách slot giờ còn trống cho một ngày
 * @param {string} date - YYYY-MM-DD format
 * @returns {Promise<Array>} - Mảng các slot giờ
 */
export const getAvailableSlots = async (date) => {
  try {
    const response = await api.get(
      `/appointments/available-slots?date=${date}`,
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching available slots:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────
// CUSTOMER: Create Appointment
// ────────────────────────────────────────────────────────────────────

/**
 * Đặt lịch hẹn mới (Customer)
 * @param {Object} data - { appointmentTime, vehicleId?, symptoms?, notes? }
 * @returns {Promise<Object>} - { id, status: "PENDING", ... }
 */
export const createAppointment = async (data) => {
  try {
    const response = await api.post("/appointments", data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating appointment:", error);
    throw error;
  }
};

/**
 * Lấy danh sách lịch hẹn của khách hàng (Customer)
 * @returns {Promise<Array>}
 */
export const getMyAppointments = async () => {
  try {
    const response = await api.get("/appointments/my");
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching my appointments:", error);
    throw error;
  }
};

/**
 * Hủy lịch hẹn (Customer) - chỉ có thể hủy PENDING
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const cancelMyAppointment = async (id) => {
  try {
    const response = await api.patch(`/appointments/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error("❌ Error cancelling appointment:", error);
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────────
// ADMIN: Manage Appointments
// ────────────────────────────────────────────────────────────────────

/**
 * Lấy danh sách lịch hẹn (Admin)
 * @param {string} status - PENDING, CONFIRMED, CANCELLED
 * @param {string} date - YYYY-MM-DD format
 * @returns {Promise<Array>}
 */
export const getAdminAppointments = async (status = null, date = null) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (date) params.append("date", date);

    const response = await api.get(`/admin/appointments?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching admin appointments:", error);
    throw error;
  }
};

/**
 * Lấy chi tiết lịch hẹn (Admin)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getAdminAppointmentDetail = async (id) => {
  try {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching appointment detail:", error);
    throw error;
  }
};

/**
 * Xác nhận lịch hẹn (Admin)
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const confirmAppointment = async (id) => {
  try {
    const response = await api.patch(`/admin/appointments/${id}/confirm`);
    return response.data;
  } catch (error) {
    console.error("❌ Error confirming appointment:", error);
    throw error;
  }
};

/**
 * Hủy lịch hẹn (Admin)
 * @param {number} id
 * @param {string} reason - Lý do hủy
 * @returns {Promise<Object>}
 */
export const cancelAdminAppointment = async (id, reason = "") => {
  try {
    const response = await api.patch(`/admin/appointments/${id}/cancel`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error cancelling appointment:", error);
    throw error;
  }
};

/**
 * Cập nhật lịch hẹn (Admin) - gán KTV, cập nhật symptoms, etc
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateAppointment = async (id, data) => {
  try {
    const response = await api.patch(`/admin/appointments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    throw error;
  }
};

/**
 * Lấy lịch hẹn của khách hàng (Admin)
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
export const getCustomerAppointments = async (customerId) => {
  try {
    const response = await api.get(
      `/admin/appointments/customer/${customerId}`,
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching customer appointments:", error);
    throw error;
  }
};
