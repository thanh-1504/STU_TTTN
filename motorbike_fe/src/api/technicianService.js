import api from "./axios";

const handleErr = (err) => {
  console.error("❌ Technician API:", err);
  throw err;
};

export const getTechnicianDashboard = () =>
  api.get("/technician/dashboard").then((r) => r.data).catch(handleErr);

export const getTechnicianOrders = (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.append("status", params.status);
  if (params.today) q.append("today", "true");
  if (params.overdue) q.append("overdue", "true");
  const s = q.toString();
  return api
    .get(`/technician/repair-orders${s ? `?${s}` : ""}`)
    .then((r) => r.data)
    .catch(handleErr);
};

export const getTechnicianOrderDetail = (id) =>
  api.get(`/technician/repair-orders/${id}`).then((r) => r.data);

export const updateRepairStatus = (id, payload) =>
  api.patch(`/technician/repair-orders/${id}/status`, payload).then((r) => r.data);

export const addRepairItem = (id, payload) =>
  api.post(`/technician/repair-orders/${id}/items`, payload).then((r) => r.data);

export const addRepairService = (id, payload) =>
  api.post(`/technician/repair-orders/${id}/services`, payload).then((r) => r.data);

export const updateVehicleKm = (id, currentKm) =>
  api.patch(`/technician/repair-orders/${id}/vehicle-km`, { currentKm }).then((r) => r.data);

export const requestExtraQuote = (id, payload) =>
  api.post(`/technician/repair-orders/${id}/extra-quote`, payload).then((r) => r.data);

export const completeRepair = (id, payload) =>
  api.post(`/technician/repair-orders/${id}/complete`, payload).then((r) => r.data);
