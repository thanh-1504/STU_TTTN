import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div>
      <Outlet />
    </div>
    // <div className="min-h-screen flex flex-col bg-gray-50">
    //   {/* Header */}
    //   <header className="bg-red-700 text-white shadow-md sticky top-0 z-50">
    //     <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    //       <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
    //         <span>🏍️</span>
    //         <span>Xe Gắn Máy Pro</span>
    //       </Link>
    //       <nav className="hidden md:flex gap-6 text-sm font-medium">
    //         <NavLink to="/" end className={({ isActive }) => isActive ? 'underline' : 'hover:underline'}>
    //           Trang chủ
    //         </NavLink>
    //         <NavLink to="/dich-vu" className={({ isActive }) => isActive ? 'underline' : 'hover:underline'}>
    //           Dịch vụ
    //         </NavLink>
    //         <NavLink to="/blog" className={({ isActive }) => isActive ? 'underline' : 'hover:underline'}>
    //           Blog
    //         </NavLink>
    //         <NavLink to="/dat-lich" className={({ isActive }) => isActive ? 'underline' : 'hover:underline'}>
    //           Đặt lịch
    //         </NavLink>
    //         <NavLink to="/portal" className={({ isActive }) => isActive ? 'underline' : 'hover:underline'}>
    //           Tra cứu
    //         </NavLink>
    //       </nav>
    //     </div>
    //   </header>

    //   {/* Nội dung trang */}
    //   <main className="flex-1">
    //     <Outlet />
    //   </main>

    //   {/* Footer */}
    //   <footer className="bg-gray-800 text-gray-300 text-sm py-6 px-4">
    //     <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-4">
    //       <p>© 2025 Xe Gắn Máy Pro. Bảo lưu mọi quyền.</p>
    //       <p>📞 1900 xxxx &nbsp;|&nbsp; ✉️ support@xegangmaypro.vn</p>
    //     </div>
    //   </footer>
    // </div>
  );
}
