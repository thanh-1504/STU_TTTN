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

export const getSpareParts = async ({ search = "", belowMinStock = false } = {}) => {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  if (belowMinStock) {
    params.append("belowMinStock", "true");
  }

  const queryString = params.toString();
  const url = queryString
    ? `/admin/spare-parts?${queryString}`
    : "/admin/spare-parts";

  const response = await api.get(url);
  return response.data;
};

export const getSparePartById = async (id) => {
  const response = await api.get(`/admin/spare-parts/${id}`);
  return response.data;
};

export const createSparePart = async (payload) => {
  try {
    const response = await api.post("/admin/spare-parts", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Tao phu tung that bai");
  }
};

export const updateSparePart = async (id, payload) => {
  try {
    const response = await api.patch(`/admin/spare-parts/${id}`, payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Cap nhat phu tung that bai");
  }
};

export const getImportOrders = async () => {
  const response = await api.get("/admin/import-orders");
  return response.data;
};

export const getImportOrderById = async (id) => {
  const response = await api.get(`/admin/import-orders/${id}`);
  return response.data;
};

export const createImportOrder = async (payload) => {
  try {
    const response = await api.post("/admin/import-orders", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Tao phieu nhap that bai");
  }
};
