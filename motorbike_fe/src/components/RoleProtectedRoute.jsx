import { Navigate, useLocation } from "react-router-dom";

/**
 * Bảo vệ route theo role.
 * Đọc user_info từ localStorage (đã lưu khi login).
 *
 * @param allowedRoles - Mảng RoleName được phép truy cập
 * @param children     - Component con
 */
export default function RoleProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  const userType = localStorage.getItem("user_type");
  const userInfoRaw = localStorage.getItem("user_info");

  if (!token || userType !== "staff" || !userInfoRaw) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  let role = "";
  try {
    role = JSON.parse(userInfoRaw)?.role || "";
  } catch {
    return <Navigate to="/admin/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Điều hướng tới khu vực phù hợp với role hiện tại
    if (role === "ADMIN") return <Navigate to="/admin" replace />;
    if (role === "RECEPTIONIST") return <Navigate to="/receptionist" replace />;
    if (role === "TECHNICIAN") return <Navigate to="/technician" replace />;
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
