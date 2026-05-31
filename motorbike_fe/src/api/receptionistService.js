import api from "./axios";

const handleErr = (err) => {
  console.error("❌ Receptionist API:", err);
  throw err;
};

// ── Dashboard ──────────────────────────────────────────────
export const getReceptionistDashboard = () =>
  api.get("/receptionist/dashboard").then((r) => r.data).catch(handleErr);

export const getReceptionistTechnicians = () =>
  api.get("/receptionist/technicians").then((r) => r.data).catch(handleErr);

// ── Appointments ───────────────────────────────────────────
export const getReceptionistAppointments = (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.append("status", params.status);
  if (params.date) q.append("date", params.date);
  if (params.technicianId) q.append("technicianId", params.technicianId);
  if (params.search) q.append("search", params.search);
  const s = q.toString();
  return api
    .get(`/receptionist/appointments${s ? `?${s}` : ""}`)
    .then((r) => r.data)
    .catch(handleErr);
};

export const getReceptionistAppointmentDetail = (id) =>
  api.get(`/receptionist/appointments/${id}`).then((r) => r.data).catch(handleErr);

export const createReceptionistAppointment = (payload) =>
  api.post("/receptionist/appointments", payload).then((r) => r.data);

export const assignTechnician = (id, technicianId) =>
  api
    .patch(`/receptionist/appointments/${id}/assign`, { technicianId })
    .then((r) => r.data);

export const rescheduleAppointment = (id, appointmentTime) =>
  api
    .patch(`/receptionist/appointments/${id}/reschedule`, { appointmentTime })
    .then((r) => r.data);

// ── Repair Orders ──────────────────────────────────────────
export const getReceptionistRepairOrders = (status) => {
  const q = status ? `?status=${status}` : "";
  return api.get(`/receptionist/repair-orders${q}`).then((r) => r.data).catch(handleErr);
};

export const getRepairOrderDetail = (id) =>
  api.get(`/receptionist/repair-orders/${id}`).then((r) => r.data);

export const createRepairOrder = (payload) =>
  api.post("/receptionist/repair-orders", payload).then((r) => r.data);

export const previewVoucher = (id, voucherCode) =>
  api
    .post(`/receptionist/repair-orders/${id}/preview-voucher`, { voucherCode })
    .then((r) => r.data);

export const getPaymentInfo = () =>
  api.get("/receptionist/payment-info").then((r) => r.data).catch(handleErr);

export const payRepairOrder = (id, payload) =>
  api.post(`/receptionist/repair-orders/${id}/pay`, payload).then((r) => r.data);

// ── Customers ──────────────────────────────────────────────
export const getReceptionistCustomers = (search = "") => {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get(`/receptionist/customers${q}`).then((r) => r.data).catch(handleErr);
};

export const getReceptionistCustomerDetail = (id) =>
  api.get(`/receptionist/customers/${id}`).then((r) => r.data);

// ── Vehicles ───────────────────────────────────────────────
export const getReceptionistVehicles = (search = "") => {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return api.get(`/receptionist/vehicles${q}`).then((r) => r.data).catch(handleErr);
};

export const getReceptionistVehicleDetail = (id) =>
  api.get(`/receptionist/vehicles/${id}`).then((r) => r.data);
