import { CircleUser, ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import { getCombosForCustomer } from "../../api/combosService";
import { useNotification } from "../../components/Notification";

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

export default function Combo() {
  const { notify, notifications } = useNotification();
  const [combos, setCombos] = useState([]);
  const [popularCombos, setPopularCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);
  const take = 6;

  const isLoggedIn = !!getToken();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [combosRes, popularRes] = await Promise.all([
        getCombosForCustomer(take, 0),
        getCombosForCustomer(6, 0, "newest"),
      ]);
      setCombos(combosRes.data || []);
      setTotal(combosRes.total || 0);
      setPopularCombos(popularRes.data || []);
      setSkip(take);
    } catch (err) {
      console.error("Error fetching combos:", err);
      setError("Không thể tải danh sách combo");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      const combosRes = await getCombosForCustomer(take, skip);
      setCombos((prev) => [...prev, ...(combosRes.data || [])]);
      setSkip((prev) => prev + take);
    } catch (err) {
      console.error("Error loading more:", err);
    }
  };

  const getComboPrice = (combo) => {
    const total = combo?.services?.reduce((sum, service) => sum + Number(service.priceManual || 0), 0) || 0;
    const discount = combo?.discountPct ? Number(combo.discountPct) : 0;
    return total - (total * discount / 100);
  };

  const handleComboClick = (combo) => {
    navigate(`/combo/${combo.id}`);
  };

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

  return (
    <div className="font-[Tahoma,Arial,sans-serif] text-[14px] text-[#333] bg-[#f4f4f4] min-h-screen">
      {/* BEGIN: Main Header */}
      <header className="bg-white py-4 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-[15px] flex flex-wrap items-center justify-between">
          {/* Logo */}
          <NavLink
            to={"/"}
            className="text-2xl font-black text-red-600 uppercase"
          >
            Shop2banh
          </NavLink>
          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative flex">
              <input
                className="w-full border-2 border-[#D73417] px-4 py-2 focus:outline-none"
                placeholder="Nhập tên sản phẩm muốn tìm..."
                type="text"
              />
              <button className="bg-[#D73417] text-white px-6 py-2">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
          {/* Store & Cart */}
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
      {/* END: Main Header */}

      {/* BEGIN: Main Content Area */}
      <main className="max-w-[1200px] mx-auto px-[15px] py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* BEGIN: Sidebar */}
          <aside className="w-full lg:w-1/4 space-y-6">
            {/* Popular Products Section */}
            <section
              className="bg-white border rounded p-4"
              data-purpose="sidebar-popular"
            >
              <h2 className="font-bold text-gray-800 uppercase border-b pb-2 mb-3 text-sm">
                QUAN TÂM NHIỀU
              </h2>
              <div className="space-y-4">
                {popularCombos && popularCombos.length > 0 ? (
                  popularCombos.map((combo) => (
                    <div key={`popular-${combo.id}`} className="flex gap-2 cursor-pointer" onClick={() => handleComboClick(combo)}>
                      {combo?.imageUrl ? (
                        <img
                          alt={combo.comboName}
                          className="w-16 h-16 object-cover border"
                          src={combo.imageUrl}
                        />
                      ) : (
                        <div className="w-16 h-16 border bg-gray-100 flex items-center justify-center text-center">
                          <span className="text-[10px] text-gray-500 font-medium p-1">Đang Cập Nhật</span>
                        </div>
                      )}
                      <div>
                        <a
                          className="text-xs font-bold block hover:text-[#D73417] leading-tight"
                          onClick={(e) => {
                            e.preventDefault();
                            handleComboClick(combo);
                          }}
                        >
                          {combo.comboName}
                        </a>
                        <p className="text-[#D73417] font-bold text-sm mt-1">
                          {formatPrice(getComboPrice(combo))}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa có combo nào.</p>
                )}
              </div>
            </section>
          </aside>
          {/* END: Sidebar */}

          {/* BEGIN: Main Grid Area */}
          <div className="w-full lg:w-3/4">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#D73417] pb-1">
              <h1 className="text-lg font-bold uppercase text-[#D73417]">
                Combo
              </h1>
              <span className="text-xs text-gray-500">
                Có {total ?? 0} sản phẩm
              </span>
            </div>
            {/* Service Cards Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              data-purpose="service-grid"
            >
              {loading && combos.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-[#D73417] border-t-transparent rounded-full"></div>
                  <p className="mt-2 text-gray-500">Đang tải...</p>
                </div>
              ) : combos && combos.length > 0 ? (
                combos.map((combo) => (
                  <article
                    onClick={() => handleComboClick(combo)}
                    key={combo.id}
                    className="bg-white overflow-hidden flex flex-col group hover:cursor-pointer"
                  >
                    <div className="relative aspect-square overflow-hidden border bg-gray-50 flex items-center justify-center">
                      {combo?.imageUrl ? (
                        <img
                          alt={combo.comboName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          src={combo.imageUrl}
                        />
                      ) : (
                        <span className="text-gray-400 font-medium">Đang Cập Nhật</span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="text-sm font-bold mb-2 group-hover:text-[#D73417] h-10 overflow-hidden">
                        {combo.comboName ?? ""}
                      </h3>
                      <p className="text-[#D73417] font-bold text-lg">
                        {formatPrice(getComboPrice(combo))}
                      </p>
                    </div>
                  </article>
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-gray-500">
                  Không tìm thấy combo nào.
                </div>
              )}
            </div>

            {/* BEGIN: Pagination */}
            {skip < total && (
              <div className="mt-12 flex flex-col items-center space-y-4">
                <button
                  onClick={handleLoadMore}
                  className="bg-[#4CAF50] text-white px-8 py-2 rounded text-sm font-bold hover:bg-green-600"
                >
                  Xem Thêm
                </button>
              </div>
            )}
            {/* END: Pagination */}
          </div>
          {/* END: Main Grid Area */}
        </div>
      </main>
      {/* END: Main Content Area */}

      {/* BEGIN: Footer Area */}
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
      {/* END: Footer Area */}
    </div>
  );
}
