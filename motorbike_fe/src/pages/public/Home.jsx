import { CircleUser, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getToken, logout } from "../../api/authService";

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  // Thêm state để quản lý việc hiển thị dropdown
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleBooking = () => {
    if (isLoggedIn) {
      navigate("/booking");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload(); // reload để reset isLoggedIn state
  };

  const featuredServices = [
    {
      title: "Thay nhớt chính hãng",
      desc: "Các dòng nhớt cao cấp cho xe ga, xe số. Miễn phí công thay.",
      icon: "🛢️",
    },
    {
      title: "Rửa xe siêu sạch",
      desc: "Công nghệ rửa không chạm, bảo vệ màu sơn nguyên bản.",
      icon: "🚿",
    },
  ];

  const blogs = [
    {
      category: "Mẹo vặt",
      title: "Bao tay xe máy loại nào êm ái đi xa không mỏi?",
      desc: "Gợi ý top 5 bao tay chống rung tốt nhất cho các phượt thủ.",
    },
    {
      category: "Hướng dẫn",
      title: "Khi nào cần thay lốp xe máy? Dấu hiệu nhận biết",
      desc: "Đừng để lốp mòn nguy hiểm mới thay.",
    },
    {
      category: "Khuyến mãi",
      title: "Tặng combo vệ sinh nhông sên dĩa khi thay nhớt",
      desc: "Áp dụng tại tất cả chi nhánh.",
    },
    {
      category: "Review",
      title: "Đánh giá đèn bi cầu Kenzo ZX",
      desc: "Có đáng nâng cấp hay không?",
    },
  ];

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <NavLink
            to={"/"}
            className="text-2xl font-black text-red-600 uppercase"
          >
            Shop2banh
          </NavLink>

          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <NavLink to="/" className="hover:text-red-600">
              Trang chủ
            </NavLink>
            <NavLink
              to="/services"
              className="text-red-600 border-b-2 border-red-600 pb-1"
            >
              Dịch vụ
            </NavLink>
            <NavLink to="/combo" className="hover:text-red-600">
              Combo
            </NavLink>
            <NavLink to="/blog" className="hover:text-red-600">
              Blog
            </NavLink>
          </nav>

          {/* Wrapper chứa Icons và Nút đặt lịch */}
          <div className="flex items-center gap-5">
            {/* Icon Giỏ hàng - chỉ hiện khi chưa login */}
            {isLoggedIn && (
              <a
                href="#"
                className="text-gray-700 hover:text-red-600 transition-colors"
              >
                <ShoppingCart size={22} strokeWidth={1.5} />
              </a>
            )}

            {/* Icon User với Dropdown - chỉ hiện khi chưa login */}
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none flex items-center pt-1 hover:cursor-pointer"
                >
                  <CircleUser size={24} strokeWidth={1.5} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-md shadow-lg py-2 z-50">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Hồ sơ
                    </a>
                    <NavLink
                      to="/history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Lịch sử
                    </NavLink>
                    <NavLink
                      to="/maintenance-plan"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Theo dõi kế hoạch bảo trì
                    </NavLink>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Nút Đặt lịch - điều hướng theo trạng thái đăng nhập */}
            <button
              onClick={handleBooking}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hidden md:block hover:bg-red-700 transition-colors"
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[600px] bg-black text-white">
        <img
          src="https://images.unsplash.com/photo-1558981806-ec527fa84c39"
          alt="motorbike"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl">
            <span className="bg-red-500 px-4 py-1 rounded-full text-sm font-semibold">
              Khuyến mãi tháng này
            </span>

            <h2 className="text-5xl font-bold mt-6 leading-tight">
              Giảm 20% gói bảo dưỡng tổng quát
            </h2>

            <p className="mt-4 text-lg text-gray-200">
              Chăm sóc xế yêu của bạn với dịch vụ chuyên nghiệp hàng đầu.
            </p>

            <button className="mt-8 bg-red-600 px-6 py-3 rounded-md font-semibold hover:bg-red-700">
              Xem chi tiết
            </button>
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h3 className="text-3xl font-bold">Dịch vụ nổi bật</h3>
          <p className="text-gray-500 mt-2">
            Giải pháp toàn diện cho xe máy của bạn
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Big card */}
          <div className="md:col-span-2 bg-gray-900 text-white rounded-xl p-8 relative overflow-hidden min-h-[320px]">
            <img
              src="https://images.unsplash.com/photo-1517846693594-1567da72af75"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />

            <div className="relative z-10">
              <h4 className="text-3xl font-bold">Bảo dưỡng định kỳ</h4>
              <p className="mt-4 max-w-md text-gray-200">
                Kiểm tra toàn diện giúp xe vận hành êm ái và bền bỉ.
              </p>
            </div>
          </div>

          {/* Small cards */}
          <div className="space-y-6">
            {featuredServices.map((item, index) => (
              <div
                key={index}
                className="border rounded-xl p-6 hover:border-red-500 transition"
              >
                <div className="text-3xl">{item.icon}</div>
                <h5 className="font-bold text-lg mt-4">{item.title}</h5>
                <p className="text-sm text-gray-500 mt-2">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold mb-10">Bài viết mới nhất</h3>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {blogs.map((blog, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-44 bg-gray-200"></div>

                <div className="p-5">
                  <span className="text-xs uppercase text-red-600 font-semibold">
                    {blog.category}
                  </span>

                  <h4 className="font-bold mt-2 line-clamp-2">{blog.title}</h4>

                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {blog.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-100 border-t border-gray-300 mt-12 pt-10 pb-6">
        <div className="max-w-[1200px] mx-auto px-[15px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1 */}
            <div data-purpose="footer-col-1">
              <h4 className="font-bold text-sm mb-4 uppercase">
                Hỗ trợ khách hàng
              </h4>
              <ul className="text-xs space-y-2 text-gray-600">
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Hướng dẫn mua hàng
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Phương thức thanh toán
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Chính sách bảo mật
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Chính sách đổi trả
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Câu hỏi thường gặp
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2 */}
            <div data-purpose="footer-col-2">
              <h4 className="font-bold text-sm mb-4 uppercase">Về Shop2banh</h4>
              <ul className="text-xs space-y-2 text-gray-600">
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Giới thiệu hệ thống
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Tuyển dụng
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Tin tức xe máy
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Liên hệ quảng cáo
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3 */}
            <div data-purpose="footer-col-3">
              <h4 className="font-bold text-sm mb-4 uppercase">
                Sản phẩm nổi bật
              </h4>
              <ul className="text-xs space-y-2 text-gray-600">
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Đồ chơi xe Exciter
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Đồ chơi xe Winner
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Đồ chơi xe Vario/Click
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Phụ tùng xe Honda
                  </a>
                </li>
                <li>
                  <a className="hover:text-[#D73417]" href="#">
                    Phụ tùng xe Yamaha
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div data-purpose="footer-col-4">
              <h4 className="font-bold text-sm mb-4 uppercase">
                Kết nối với chúng tôi
              </h4>
              <div className="flex space-x-4 mb-4">
                <a className="bg-blue-600 text-white p-2 rounded-full" href="#">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path>
                  </svg>
                </a>
                <a className="bg-red-600 text-white p-2 rounded-full" href="#">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                  </svg>
                </a>
              </div>
              <div className="text-xs text-gray-600">
                <p className="font-bold">CÔNG TY TNHH TRUYỀN THÔNG SỐ</p>
                <p>
                  📍 Trụ sở: 309 Vườn Lài, P. Phú Thọ Hòa, Q. Tân Phú, TP.HCM
                </p>
                <p>📞 Điện thoại: 0938.82.02.02</p>
                <p>📧 Email: info@shop2banh.vn</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-[10px] text-gray-500 uppercase tracking-widest">
            Copyright © 2023 Shop2banh.vn. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
