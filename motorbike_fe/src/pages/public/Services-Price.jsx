import { CircleUser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import {
  getServiceByIdForCustomer,
  getServicesForCustomer,
} from "../../api/servicesService";
import CartBadge from "../../components/CartBadge";
import { useCart } from "../../contexts/CartContext";

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Skeletons ────────────────────────────────────────────────────────────────
function SkeletonBox({ className }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`} />
  );
}

function SkeletonDetail() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonBox className="aspect-square w-full" />
      <div className="space-y-4 pt-2">
        <SkeletonBox className="h-7 w-3/4" />
        <SkeletonBox className="h-4 w-1/2" />
        <SkeletonBox className="h-9 w-1/3" />
        <SkeletonBox className="h-4 w-1/4" />
        <SkeletonBox className="h-12 w-full mt-4" />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-gray-100 p-2 animate-pulse">
      <SkeletonBox className="w-full aspect-square mb-2" />
      <SkeletonBox className="h-3 w-full mb-1" />
      <SkeletonBox className="h-3 w-2/3 mb-2" />
      <SkeletonBox className="h-4 w-1/2" />
    </div>
  );
}

function SkeletonSidebarItem() {
  return (
    <div className="flex space-x-3 items-center animate-pulse">
      <SkeletonBox className="w-12 h-12 shrink-0" />
      <div className="flex-1 space-y-1">
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-3 w-2/3" />
        <SkeletonBox className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ─── ServiceImage ──────────────────────────────────────────────────────────────
function ServiceImage({ src, alt, className }) {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm font-medium">
      Đang Cập Nhật
    </div>
  );
}

// ─── SmallServiceImage ─────────────────────────────────────────────────────────
function SmallServiceImage({ src, alt, className }) {
  if (src) {
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <div
      className={`flex items-center justify-center bg-gray-100 text-gray-400 text-[9px] text-center leading-tight ${className ?? ""}`}
    >
      Đang Cập Nhật
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const ServicesPrice = () => {
  const { id } = useParams();
  const isLoggedIn = !!getToken();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { addItem, items } = useCart();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetchData();
    // scroll to top on id change
    window.scrollTo({ top: 0 });
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [detail, list] = await Promise.all([
        getServiceByIdForCustomer(Number(id)),
        getServicesForCustomer(),
      ]);
      setService(detail);
      setAllServices(Array.isArray(list) ? list.filter((s) => s.isActive) : []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải thông tin dịch vụ.");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived sections (exclude current service) ──────────────────────────────
  const othersShuffled = useMemo(() => {
    return shuffle(allServices.filter((s) => s.id !== Number(id)));
  }, [allServices, id]);
  const crossSell = othersShuffled.slice(0, 2);
  const popular = othersShuffled.slice(2, 8); // 6 items
  const similar = othersShuffled.slice(8, 13); // 5 items

  const isInCart = useMemo(() => {
    if (!service?.id) return false;
    return items.some((item) => item.key === `service-${service.id}`);
  }, [items, service?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleBooking = () => navigate(isLoggedIn ? "/booking" : "/login");
  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };
  const handleServiceClick = (s) => navigate(`/services-price/${s.id}`);

  const handleAddToCart = () => {
    if (!service || !inStock) return;
    if (isInCart) {
      toast("Dịch vụ đã có trong giỏ hàng.");
      return;
    }
    addItem({
      key: `service-${service.id}`,
      type: "service",
      id: service.id,
      name: service.serviceName,
      priceManual: service.priceManual,
      durationMinutes: service.durationMinutes,
      imageUrl: service.imageUrl,
    });
    toast.success("Đã thêm vào giỏ hàng.");
  };

  // ── Availability ───────────────────────────────────────────────────────────
  const inStock = service?.isActive ?? false;

  // ── Description text (strip HTML tags / images) ────────────────────────────
  const descriptionText = useMemo(() => {
    if (!service?.description) return "";
    // Remove HTML tags (including img tags) and decode basic entities
    return service.description
      .replace(/<img[^>]*>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, " ")
      .trim();
  }, [service]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <NavLink
            to="/"
            className="text-2xl font-black text-red-600 uppercase"
          >
            Shop2banh
          </NavLink>

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
                    <NavLink
                      to="/maintenance-plan"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Theo dõi kế hoạch bảo trì
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

      {/* ── Main ── */}
      <main className="bg-white">
        {/* Breadcrumb */}
        <div className="bg-gray-100 py-2">
          <div className="max-w-[1200px] mx-auto px-[15px] text-xs text-gray-500">
            <NavLink to="/" className="hover:text-[#D73417]">
              Trang chủ
            </NavLink>{" "}
            &gt;{" "}
            <NavLink to="/services" className="hover:text-[#D73417]">
              Dịch vụ sửa chữa
            </NavLink>{" "}
            &gt;{" "}
            <span className="text-gray-800">
              {loading
                ? "Đang tải..."
                : (service?.serviceName ?? "Chi tiết dịch vụ")}
            </span>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-[15px] py-8">
          {/* ── Error ── */}
          {error && (
            <div className="text-center py-16 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {loading && !error && (
            <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-9">
                <SkeletonDetail />
              </div>
              <aside className="col-span-12 lg:col-span-3 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonSidebarItem key={i} />
                ))}
              </aside>
            </div>
          )}

          {/* ── Content ── */}
          {!loading && !error && service && (
            <div className="grid grid-cols-12 gap-8">
              {/* ── Left Column ── */}
              <div className="col-span-12 lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Image */}
                  <div data-purpose="product-gallery">
                    <div className="border border-gray-200 h-[350px] md:h-[450px] flex items-center justify-center overflow-hidden bg-white">
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.serviceName}
                          className="max-w-full max-h-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-gray-400 text-base font-medium">
                          Đang Cập Nhật
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Summary */}
                  <div data-purpose="product-summary">
                    <h1 className="text-2xl font-bold text-gray-800 mb-3">
                      {service.serviceName}
                    </h1>

                    {/* Price */}
                    {service.priceManual != null && (
                      <div className="text-3xl font-bold text-[#D73417] mb-4">
                        {formatPrice(service.priceManual)}
                      </div>
                    )}

                    {/* Stock status */}
                    <div className="flex items-center space-x-3 mb-6 text-sm">
                      <span className="text-gray-500">Tình trạng:</span>
                      {inStock ? (
                        <span className="text-green-600 font-semibold">
                          ✔ Còn hàng
                        </span>
                      ) : (
                        <span className="text-red-500 font-semibold">
                          ✘ Hết hàng
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    {inStock ? (
                      <div className="space-y-3">
                        <button
                          onClick={handleAddToCart}
                          disabled={isInCart}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded text-base uppercase shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isInCart ? "ĐÃ CÓ TRONG GIỎ" : "THÊM VÀO GIỎ"}
                        </button>
                        <button
                          onClick={handleBooking}
                          className="w-full bg-[#D73417] hover:bg-red-700 text-white font-bold py-3 rounded text-sm uppercase shadow-md transition-colors"
                        >
                          ĐẶT LỊCH NGAY
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 font-bold py-4 rounded text-xl uppercase shadow-sm cursor-not-allowed"
                      >
                        HẾT HÀNG
                      </button>
                    )}

                    {/* Frequently Purchased Together — 2 items */}
                    {crossSell.length > 0 && (
                      <div className="mt-8 border rounded-lg p-4 bg-gray-50">
                        <h3 className="font-bold text-gray-700 mb-3 text-sm">
                          Thường được mua cùng:
                        </h3>
                        <div className="space-y-3">
                          {crossSell.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center text-xs gap-2 cursor-pointer"
                              onClick={() => handleServiceClick(item)}
                            >
                              <input
                                className="rounded text-[#D73417] focus:ring-[#D73417]"
                                type="checkbox"
                                readOnly
                                checked
                              />
                              <div className="w-8 h-8 shrink-0 border overflow-hidden bg-gray-100 flex items-center justify-center">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.serviceName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[7px] text-gray-400 text-center leading-tight">
                                    Đang cập nhật
                                  </span>
                                )}
                              </div>
                              <span className="flex-grow line-clamp-1">
                                {item.serviceName}
                              </span>
                              {item.priceManual != null && (
                                <span className="font-bold text-[#D73417] shrink-0">
                                  {formatPrice(item.priceManual)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleBooking}
                          className="w-full mt-4 bg-[#D73417] text-white py-2 rounded font-bold text-xs hover:bg-red-700 transition-colors"
                        >
                          Đặt lịch ngay
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Chi Tiết (Description — text only) ── */}
                <div className="mt-12">
                  <div className="flex border-b border-gray-200">
                    <button className="px-6 py-3 border-b-2 border-[#D73417] text-[#D73417] font-bold text-sm uppercase">
                      Chi tiết
                    </button>
                  </div>
                  <div
                    className="py-6 text-gray-700 text-sm leading-relaxed"
                    data-purpose="product-details-content"
                  >
                    {descriptionText ? (
                      <p className="whitespace-pre-line">{descriptionText}</p>
                    ) : (
                      <p className="text-gray-400 italic">
                        Chưa có mô tả chi tiết.
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Sản phẩm cùng loại — 5 items ── */}
                <div className="mt-12">
                  <h2 className="text-lg font-bold border-l-4 border-[#D73417] pl-2 mb-6 uppercase">
                    Sản phẩm cùng loại
                  </h2>

                  {similar.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      Không có sản phẩm nào.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {similar.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleServiceClick(item)}
                          className="border border-gray-100 p-2 hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center mb-2">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.serviceName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-gray-400 text-center px-1 leading-tight">
                                Đang cập nhật
                              </span>
                            )}
                          </div>
                          <h3 className="text-xs font-semibold h-8 overflow-hidden mb-1 leading-4">
                            {item.serviceName}
                          </h3>
                          {item.priceManual != null && (
                            <div className="text-[#D73417] font-bold text-sm">
                              {formatPrice(item.priceManual)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* END: Left Column */}

              {/* ── Right Sidebar ── */}
              <aside className="col-span-12 lg:col-span-3">
                {/* QUAN TÂM NHIỀU — 6 items */}
                <div className="border border-gray-200">
                  <div className="bg-gray-100 px-3 py-2 font-bold text-sm border-b border-gray-200">
                    QUAN TÂM NHIỀU
                  </div>
                  <div className="p-3 space-y-4">
                    {popular.length === 0 ? (
                      <p className="text-xs text-gray-400">Chưa có dữ liệu.</p>
                    ) : (
                      popular.map((item) => (
                        <div
                          key={item.id}
                          className="flex space-x-3 items-center cursor-pointer"
                          onClick={() => handleServiceClick(item)}
                        >
                          <div className="w-12 h-12 shrink-0 overflow-hidden border bg-gray-100 flex items-center justify-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.serviceName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[8px] text-gray-400 text-center leading-tight">
                                Đang cập nhật
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold line-clamp-2 hover:text-[#D73417]">
                              {item.serviceName}
                            </h4>
                            {item.priceManual != null && (
                              <p className="text-[#D73417] font-bold text-xs mt-0.5">
                                {formatPrice(item.priceManual)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </aside>
              {/* END: Right Sidebar */}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-100 border-t border-gray-300 mt-12 pt-10 pb-6">
        <div className="max-w-[1200px] mx-auto px-[15px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

            <div data-purpose="footer-col-4">
              <h4 className="font-bold text-sm mb-4 uppercase">
                Kết nối với chúng tôi
              </h4>
              <div className="flex space-x-4 mb-4">
                <a className="bg-blue-600 text-white p-2 rounded-full" href="#">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a className="bg-red-600 text-white p-2 rounded-full" href="#">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
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
};

export default ServicesPrice;
