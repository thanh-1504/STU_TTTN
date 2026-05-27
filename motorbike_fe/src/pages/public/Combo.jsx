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
    const total =
      combo?.services?.reduce(
        (sum, service) => sum + Number(service.priceManual || 0),
        0,
      ) || 0;
    const discount = combo?.discountPct ? Number(combo.discountPct) : 0;
    return total - (total * discount) / 100;
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
                    <div
                      key={`popular-${combo.id}`}
                      className="flex gap-2 cursor-pointer"
                      onClick={() => handleComboClick(combo)}
                    >
                      {combo?.imageUrl ? (
                        <img
                          alt={combo.comboName}
                          className="w-16 h-16 object-cover border"
                          src={combo.imageUrl}
                        />
                      ) : (
                        <div className="w-16 h-16 border bg-gray-100 flex items-center justify-center text-center">
                          <span className="text-[10px] text-gray-500 font-medium p-1">
                            Đang Cập Nhật
                          </span>
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
                  <p className="text-sm text-gray-500 italic">
                    Chưa có combo nào.
                  </p>
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
                        <span className="text-gray-400 font-medium">
                          Đang Cập Nhật
                        </span>
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
      <footer className="bg-gray-900 text-gray-400 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="text-xl font-black text-white uppercase mb-3">
                Shop2banh
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Hệ thống dịch vụ xe máy chuyên nghiệp, uy tín tại TP.HCM.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase">
                Dịch vụ
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  "Bảo dưỡng định kỳ",
                  "Thay nhớt",
                  "Rửa xe",
                  "Sửa chữa điện",
                  "Thay lốp",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="/services"
                      className="hover:text-red-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase">
                Hỗ trợ
              </h4>
              <ul className="space-y-2 text-sm">
                {[
                  "Hướng dẫn đặt lịch",
                  "Chính sách bảo hành",
                  "Câu hỏi thường gặp",
                  "Liên hệ",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-red-400 transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4 uppercase">
                Liên hệ
              </h4>
              <ul className="space-y-2 text-sm">
                <li>309 Vườn Lài, P. Phú Thọ Hòa, Q. Tân Phú, TP.HCM</li>
                <li>
                  SĐT:{" "}
                  <a href="tel:0938820202" className="hover:text-red-400">
                    0938.82.02.02
                  </a>
                </li>
                <li>
                  Email:{" "}
                  <a
                    href="mailto:info@shop2banh.vn"
                    className="hover:text-red-400"
                  >
                    shop2banh@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* END: Footer Area */}
    </div>
  );
}
