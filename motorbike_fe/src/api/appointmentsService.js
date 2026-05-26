import api from "./axios";

export const getAvailableSlots = async (date) => {
  try {
    const response = await api.get(`/appointments/available-slots?date=${date}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching available slots:", error);
    throw error;
  }
};

export const createAppointment = async (data) => {
  try {
    const response = await api.post("/appointments", data);
    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

export const createAdminAppointment = async (data) => {
  try {
    const response = await api.post("/admin/appointments", data);
    return response.data;
  } catch (error) {
    console.error("Error creating admin appointment:", error);
    throw error;
  }
};

export const getMyAppointments = async () => {
  try {
    const response = await api.get("/appointments/my");
    return response.data;
  } catch (error) {
    console.error("Error fetching my appointments:", error);
    throw error;
  }
};

export const cancelMyAppointment = async (id) => {
  try {
    const response = await api.patch(`/appointments/${id}/cancel`);
    return response.data;
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw error;
  }
};

export const getAdminAppointments = async (status = null, date = null) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (date) params.append("date", date);

    const response = await api.get(`/admin/appointments?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching admin appointments:", error);
    throw error;
  }
};

export const getAdminAppointmentDetail = async (id) => {
  try {
    const response = await api.get(`/admin/appointments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching appointment detail:", error);
    throw error;
  }
};

export const confirmAppointment = async (id) => {
  try {
    const response = await api.patch(`/admin/appointments/${id}/confirm`);
    return response.data;
  } catch (error) {
    console.error("Error confirming appointment:", error);
    throw error;
  }
};

export const cancelAdminAppointment = async (id, reason = "") => {
  try {
    const response = await api.patch(`/admin/appointments/${id}/cancel`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    throw error;
  }
};

export const updateAppointment = async (id, data) => {
  try {
    const response = await api.patch(`/admin/appointments/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating appointment:", error);
    throw error;
  }
};

export const getCustomerAppointments = async (customerId) => {
  try {
    const response = await api.get(`/admin/appointments/customer/${customerId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching customer appointments:", error);
    throw error;
  }
};
