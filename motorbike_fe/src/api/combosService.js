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

// Public API - For customers (no authentication required)
export const getCombosForCustomer = async (take, skip, sortBy) => {
  try {
    const params = {};
    if (take !== undefined) params.take = take;
    if (skip !== undefined) params.skip = skip;
    if (sortBy !== undefined) params.sortBy = sortBy;

    const response = await api.get("/combos", { params });
    return response.data; // { data: [...], total: ... }
  } catch (error) {
    console.error("Error fetching combos:", error);
    return { data: [], total: 0 };
  }
};

export const getComboByIdForCustomer = async (id) => {
  try {
    const response = await api.get(`/combos/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching combo:", error);
    throw error;
  }
};

// Admin API - For admin/receptionist (requires authentication)
export const getCombos = async () => {
  try {
    const response = await api.get("/admin/combos");
    return response.data;
  } catch (error) {
    console.error("Error fetching combos:", error);
    return [];
  }
};

export const getComboById = async (id) => {
  try {
    const response = await api.get(`/admin/combos/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching combo:", error);
    throw error;
  }
};

export const createCombo = async (payload) => {
  try {
    const response = await api.post("/admin/combos", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Tao combo that bai");
  }
};

export const updateCombo = async (id, payload) => {
  try {
    const response = await api.patch(`/admin/combos/${id}`, payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Cap nhat combo that bai");
  }
};

export const uploadComboImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/admin/combos/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteCombo = async (id) => {
  try {
    const response = await api.delete(`/admin/combos/${id}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Xoa combo that bai");
  }
};
