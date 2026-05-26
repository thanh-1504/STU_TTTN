import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { logout } from "../../api/authService";

const adminNavItems = [
  { to: "/admin", label: "📊 Dashboard", end: true },
  { to: "/admin/appointments", label: "📅 Lịch hẹn" },
  { to: "/admin/services", label: "🔧 Dịch vụ" },
  { to: "/admin/combos", label: "📦 Combo" },
  { to: "/admin/spare-parts", label: "🏪 Kho phụ tùng" },
  { to: "/admin/stock", label: "🏪 Nhập kho" },
  { to: "/admin/vouchers", label: "🎟️ Voucher" },
  { to: "/admin/staff", label: "👤 Nhân viên" },
  { to: "/admin/blog", label: "📝 Blog" },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Đăng xuất?",
      text: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Đăng xuất",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-gray-100 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-700">
          <Link to="/admin" className="text-white font-bold text-lg">
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {adminNavItems.map((item) => (
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
            Quản trị hệ thống
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Đăng xuất
          </button>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
