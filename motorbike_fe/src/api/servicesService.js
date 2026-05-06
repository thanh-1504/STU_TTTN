import api from "./axios";

const parseApiErrors = (error, fallbackMessage) => {
  const errorResponse = error.response?.data;
  const fieldErrors = {};

  if (Array.isArray(errorResponse?.message)) {
    errorResponse.message.forEach((message) => {
      const match = message.match(/^([a-zA-Z0-9_]+):\s*(.+)$/);
      if (match) {
        fieldErrors[match[1]] = match[2];
      } else {
        fieldErrors.general = message;
      }
    });
  } else if (typeof errorResponse?.message === "string") {
    fieldErrors.general = errorResponse.message;
  }

  return {
    success: false,
    errors:
      Object.keys(fieldErrors).length > 0
        ? fieldErrors
        : { general: fallbackMessage },
  };
};

export const getServices = async () => {
  const response = await api.get("/admin/services");
  return response.data;
};
export const getServicesForCustomer = async () => {
  const response = await api.get("/services");
  return response.data;
};

export const getServiceById = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
};
export const getServiceByIdForCustomer = async (id) => {
  const response = await api.get(`/services/${id}`);
  return response.data;
};

export const createService = async (payload) => {
  try {
    const response = await api.post("/admin/services", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Tao dich vu that bai");
  }
};

export const updateService = async (id, payload) => {
  try {
    const response = await api.patch(`/admin/services/${id}`, payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Cap nhat dich vu that bai");
  }
};

export const uploadServiceImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/admin/services/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const removeService = async (id) => {
  const response = await api.delete(`/admin/services/${id}`);
  return response.data;
};
