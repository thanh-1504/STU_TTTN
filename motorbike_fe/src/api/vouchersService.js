import api from "./axios";

const parseApiErrors = (error, fallbackMessage) => {
  const errorResponse = error.response?.data;
  const fieldErrors = {};

  if (Array.isArray(errorResponse?.errors)) {
    errorResponse.errors.forEach((issue) => {
      const fieldName = Array.isArray(issue.path) ? issue.path[0] : null;

      if (fieldName && !fieldErrors[fieldName]) {
        fieldErrors[fieldName] = issue.message;
      }
    });
  }

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
    if (!fieldErrors.general) {
      fieldErrors.general = errorResponse.message;
    }
  }

  return {
    success: false,
    errors:
      Object.keys(fieldErrors).length > 0
        ? {
            ...fieldErrors,
            general:
              fieldErrors.general ||
              Object.values(fieldErrors).find((value) => typeof value === "string"),
          }
        : { general: fallbackMessage },
  };
};

export const getVouchers = async (status = "") => {
  const query = status ? `?status=${status}` : "";
  const response = await api.get(`/admin/vouchers${query}`);
  return response.data;
};

export const getVoucherById = async (id) => {
  const response = await api.get(`/admin/vouchers/${id}`);
  return response.data;
};

export const createVoucher = async (payload) => {
  try {
    const response = await api.post("/admin/vouchers", payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Tao khuyen mai that bai");
  }
};

export const updateVoucher = async (id, payload) => {
  try {
    const response = await api.patch(`/admin/vouchers/${id}`, payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Cap nhat khuyen mai that bai");
  }
};

export const revokeVoucher = async (id) => {
  try {
    const response = await api.post(`/admin/vouchers/${id}/revoke`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return parseApiErrors(error, "Huy khuyen mai that bai");
  }
};

/**
 * Trigger quét và cập nhật trạng thái EXPIRED cho các voucher hết hạn.
 * Gọi khi admin mở trang danh sách voucher để đồng bộ realtime.
 */
export const scanExpiredVouchers = async () => {
  try {
    const response = await api.post("/admin/vouchers/scan-expired");
    return { success: true, data: response.data };
  } catch {
    return { success: false };
  }
};
