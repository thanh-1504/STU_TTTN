import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../api/authService";

const receptionistNavItems = [
  { to: "/receptionist", label: "Dashboard", end: true },
  { to: "/receptionist/appointments", label: "Quản lý lịch hẹn" },
  { to: "/receptionist/repair-orders", label: "Tiếp nhận & Phiếu sửa" },
  { to: "/receptionist/payment", label: "Thanh toán & Bàn giao" },
  { to: "/receptionist/customers", label: "Khách hàng" },
  { to: "/receptionist/vehicles", label: "Hồ sơ xe" },
];

export default function ReceptionistLayout() {
  const navigate = useNavigate();
  const userInfoRaw = localStorage.getItem("user_info");
  const user = userInfoRaw ? JSON.parse(userInfoRaw) : null;

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <Link to="/receptionist" className="text-white font-bold text-lg">
            🏍️ Lễ tân
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {receptionistNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center px-5 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-red-600 text-white font-semibold"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-700 text-xs text-gray-500">
          v1.0.0
        </div>
      </aside>

      {/* Nội dung */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <h1 className="text-gray-700 font-semibold text-lg">
            Khu vực Lễ tân
          </h1>
          <div className="flex items-center gap-4 text-sm">
            {user && (
              <span className="text-gray-600">
                {user.fullname || user.username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}