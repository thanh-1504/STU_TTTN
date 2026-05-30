import { CircleUser, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import { getServicesForCustomer } from "../../api/servicesService";
import CartBadge from "../../components/CartBadge";

const PAGE_SIZE = 6;
const SIDEBAR_COUNT = 5;

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

/** Fisher-Yates shuffle — trả về bản sao đã xáo trộn */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Skeleton components ───────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white overflow-hidden flex flex-col animate-pulse">
      <div className="aspect-square bg-gray-200 border" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-5 bg-gray-200 rounded w-1/3 mt-1" />
      </div>
    </div>
  );
}

function SkeletonSidebarItem() {
  return (
    <div className="flex gap-2 animate-pulse">
      <div className="w-16 h-16 bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function Services() {
  const isLoggedIn = !!getToken();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sidebarItems, setSidebarItems] = useState([]);

  const searchRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getServicesForCustomer();
      const active = Array.isArray(data) ? data.filter((s) => s.isActive) : [];
      setServices(active);
      // Random sidebar
      setSidebarItems(shuffle(active).slice(0, SIDEBAR_COUNT));
    } catch (err) {
      console.error("Error fetching services:", err);
      setError("Không thể tải danh sách dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.trim().toLowerCase();
    return services.filter((s) => s.serviceName?.toLowerCase().includes(q));
  }, [searchQuery, services]);

  const displayedServices = filteredServices.slice(0, visibleCount);
  const hasMore = visibleCount < filteredServices.length;

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleSeeMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  const handleServiceClick = (service) => {
    navigate(`/services-price/${service.id}`);
  };

  const handleBooking = () => {
    navigate(isLoggedIn ? "/booking" : "/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="font-[Tahoma,Arial,sans-serif] text-[14px] text-[#333] bg-[#f4f4f4] min-h-screen">
      {/* ── Header ── */}
      <header className="bg-white py-4 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-[15px] flex flex-wrap items-center justify-between">
          {/* Logo */}
          <NavLink
            to="/"
            className="text-2xl font-black text-red-600 uppercase"
          >
            Shop2banh
          </NavLink>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative flex">
              <input
                ref={searchRef}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full border-2 border-[#D73417] px-4 py-2 focus:outline-none"
                placeholder="Nhập tên sản phẩm muốn tìm..."
                type="text"
              />
              <button
                onClick={handleSearch}
                className="bg-[#D73417] text-white px-6 py-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Icons + Booking */}
          <div className="flex items-center gap-5">
            <CartBadge />

            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none flex items-center pt-1 hover:cursor-pointer"
                >
                  <CircleUser size={24} strokeWidth={1.5} />
                </button>

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

                    <div className="border-t border-gray-100 my-1" />
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

            <button
              onClick={handleBooking}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hidden md:block hover:bg-red-700 transition-colors"
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-[1200px] mx-auto px-[15px] py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar ── */}
          <aside className="w-full lg:w-1/4 space-y-6">
            <section
              className="bg-white border rounded p-4"
              data-purpose="sidebar-popular"
            >
              <h2 className="font-bold text-gray-800 uppercase border-b pb-2 mb-3 text-sm">
                QUAN TÂM NHIỀU
              </h2>

              <div className="space-y-4">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonSidebarItem key={i} />
                    ))
                  : sidebarItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-2 cursor-pointer"
                        onClick={() => handleServiceClick(item)}
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 shrink-0 border overflow-hidden bg-gray-100 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.serviceName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-gray-400 text-center px-1 leading-tight">
                              Đang cập nhật
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold hover:text-[#D73417] leading-tight line-clamp-2">
                            {item.serviceName}
                          </p>
                          {item.priceManual != null && (
                            <p className="text-[#D73417] font-bold text-sm mt-1">
                              {formatPrice(item.priceManual)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            </section>
          </aside>

          {/* ── Product Grid ── */}
          <div className="w-full lg:w-3/4">
            {/* Header row */}
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#D73417] pb-1">
              <h1 className="text-lg font-bold uppercase text-[#D73417]">
                DỊCH VỤ SỬA CHỮA
              </h1>
              {!loading && (
                <span className="text-xs text-gray-500">
                  {searchQuery
                    ? `Tìm thấy ${filteredServices.length} sản phẩm`
                    : `Có ${services.length} sản phẩm`}
                </span>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-center py-10 text-red-500">{error}</div>
            )}

            {/* Loading skeletons */}
            {loading && !error && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                data-purpose="service-grid"
              >
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Search: no results */}
            {!loading &&
              !error &&
              searchQuery &&
              filteredServices.length === 0 && (
                <div className="flex flex-col items-center py-16 text-gray-400">
                  <Search
                    size={48}
                    strokeWidth={1}
                    className="mb-3 text-gray-300"
                  />
                  <p className="text-base font-semibold">
                    Sản phẩm không tồn tại
                  </p>
                  <p className="text-xs mt-1">
                    Không tìm thấy dịch vụ nào chứa từ khoá &ldquo;{searchQuery}
                    &rdquo;
                  </p>
                </div>
              )}

            {/* No services at all (not searching) */}
            {!loading && !error && !searchQuery && services.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                Chưa có dịch vụ nào.
              </div>
            )}

            {/* Service Cards */}
            {!loading && !error && displayedServices.length > 0 && (
              <>
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  data-purpose="service-grid"
                >
                  {displayedServices.map((service) => (
                    <article
                      key={service.id}
                      onClick={() => handleServiceClick(service)}
                      className="bg-white overflow-hidden flex flex-col group hover:cursor-pointer hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden border bg-gray-50 flex items-center justify-center">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.serviceName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">
                            Đang cập nhật
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col flex-grow">
                        <h3 className="text-sm font-bold mb-2 group-hover:text-[#D73417] h-10 overflow-hidden leading-5">
                          {service.serviceName}
                        </h3>

                        {/* Only show price for manual (xe số) */}
                        {service.priceManual != null && (
                          <p className="text-[#D73417] font-bold text-lg">
                            {formatPrice(service.priceManual)}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {/* See More */}
                {hasMore && (
                  <div className="mt-12 flex flex-col items-center space-y-4">
                    <button
                      onClick={handleSeeMore}
                      className="bg-[#4CAF50] text-white px-8 py-2 rounded text-sm font-bold hover:bg-green-600 transition-colors"
                    >
                      Xem Thêm
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
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
    </div>
  );
}

export default Services;
