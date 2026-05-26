/**
 * vehicleImage.js
 * Lightweight localStorage helpers for persisting vehicle thumbnail images
 * on the client side (the Vehicle table has no imageUrl column in the DB).
 */

const KEY = (id) => `vehicle_img_${id}`;

/** Save a base64 data URL for the given vehicle id. */
export function saveVehicleImage(vehicleId, dataUrl) {
  try {
    localStorage.setItem(KEY(vehicleId), dataUrl);
  } catch (_) {
    // storage quota exceeded — silently ignore
  }
}

/** Retrieve the persisted image data URL (or null if not set). */
export function getVehicleImage(vehicleId) {
  try {
    return localStorage.getItem(KEY(vehicleId)) || null;
  } catch (_) {
    return null;
  }
}

/** Remove the persisted image (call on vehicle deletion). */
export function removeVehicleImage(vehicleId) {
  try {
    localStorage.removeItem(KEY(vehicleId));
  } catch (_) {}
}
