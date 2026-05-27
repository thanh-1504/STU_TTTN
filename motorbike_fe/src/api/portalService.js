import axios from "./axios";

// Get list of vehicles for the customer
export const getMyVehicles = async () => {
  const response = await axios.get("/portal/vehicles");
  return response.data;
};

// Add a new vehicle
export const addVehicle = async (data) => {
  const response = await axios.post("/portal/vehicles", data);
  return response.data;
};

export const uploadVehicleImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post("/portal/vehicles/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// Update KM of a vehicle
export const updateVehicleKm = async (id, data) => {
  const response = await axios.patch(`/portal/vehicles/${id}/km`, {
    currentKm: data.currentKm,
    ...(Object.prototype.hasOwnProperty.call(data, "imageUrl")
      ? { imageUrl: data.imageUrl }
      : {}),
  });
  return response.data;
};

// Delete a vehicle
export const deleteVehicle = async (id) => {
  const response = await axios.delete(`/portal/vehicles/${id}`);
  return response.data;
};

export const getMyRepairOrders = async () => {
  const response = await axios.get("/portal/repair-orders");
  return response.data; // Hoặc response tuỳ thuộc vào cách config axios interceptor của bạn
};

export const getRepairOrderDetail = async (id) => {
  const response = await axios.get(`/portal/repair-orders/${id}`);
  return response.data;
};

export const createReview = async (data) => {
  const response = await axios.post("/portal/reviews", data);
  return response.data;
};
