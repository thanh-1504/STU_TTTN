import { ChevronRight, CircleUser, Package, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { getToken, logout } from "../../api/authService";
import { getCombosForCustomer } from "../../api/combosService";
import { getServicesForCustomer } from "../../api/servicesService";

// ─── Banner slides data ────────────────────────────────────────────────────────
const banners = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&q=80",
    badge: "Khuyến mãi tháng 5",
    title: "Giảm 20% gói\nbảo dưỡng tổng quát",
    desc: "Chăm sóc xế yêu với dịch vụ chuyên nghiệp hàng đầu.",
    cta: "Đặt lịch ngay",
    ctaLink: "/booking",
    accent: "from-black/80 via-black/40 to-transparent",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1600&q=80",
    badge: "Sản phẩm mới",
    title: "Phụ tùng chính hãng\ngiá tốt nhất thị trường",
    desc: "Hàng ngàn phụ tùng xe máy chính hãng, bảo hành đầy đủ.",
    cta: "Khám phá ngay",
    ctaLink: "/spare-parts",
    accent: "from-red-900/80 via-black/30 to-transparent",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1517846693594-1567da72af75?w=1600&q=80",
    badge: "Combo tiết kiệm",
    title: "Combo bảo dưỡng\ntiết kiệm đến 30%",
    desc: "Gói dịch vụ combo được thiết kế riêng cho từng dòng xe.",
    cta: "Xem combo",
    ctaLink: "/combo",
    accent: "from-slate-900/80 via-black/30 to-transparent",
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80",
    badge: "Ưu đãi cuối tuần",
    title: "Rửa xe miễn phí\nkhi bảo dưỡng định kỳ",
    desc: "Áp dụng mỗi cuối tuần, số lượng có hạn.",
    cta: "Đăng ký ngay",
    ctaLink: "/booking",
    accent: "from-zinc-900/80 via-black/30 to-transparent",
  },
];

// ─── Format helpers ────────────────────────────────────────────────────────────
const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

// ─── Sub-components ────────────────────────────────────────────────────────────
function SectionTitle({ label, title, desc }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
      {desc && <p className="text-gray-500 mt-1.5 text-sm">{desc}</p>}
      <div className="mt-3 flex gap-1">
        <div className="h-1 w-10 rounded-full bg-red-600" />
        <div className="h-1 w-4 rounded-full bg-red-300" />
      </div>
    </div>
  );
}

function ServiceCard({ service }) {
  const formatServicePrice = () => {
    const prices = [
      service.priceManual,
      service.priceScooter,
      service.priceMoto,
    ].filter(Boolean);
    if (prices.length === 0) return "Liên hệ";
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? formatPrice(min)
      : `${formatPrice(min)} – ${formatPrice(max)}`;
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.serviceName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wrench className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          Dịch vụ
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">
          {service.serviceName}
        </h3>
        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
          {service.description ||
            `Thời gian thực hiện: ${service.durationMinutes} phút`}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-red-600 font-bold text-sm">
            {formatServicePrice()}
          </span>
          <button
            onClick={() => (window.location.href = "/booking")}
            className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-full hover:bg-red-600 hover:text-white transition-colors"
          >
            Đặt lịch
          </button>
        </div>
      </div>
    </div>
  );
}

function ComboCard({ combo }) {
  const lowestPrice =
    combo.services?.length > 0
      ? Math.min(
          ...combo.services.flatMap((s) =>
            [s.priceManual, s.priceScooter, s.priceMoto].filter(Boolean),
          ),
        )
      : null;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {combo.discountPct && (
        <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
          -{combo.discountPct}%
        </div>
      )}
      <div className="relative h-44 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {combo.imageUrl ? (
          <img
            src={combo.imageUrl}
            alt={combo.comboName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 line-clamp-1 text-sm">
          {combo.comboName}
        </h3>
        {combo.services?.length > 0 && (
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">
            {combo.services.map((s) => s.serviceName).join(" • ")}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div>
            {lowestPrice ? (
              <span className="text-red-600 font-bold text-sm">
                Từ {formatPrice(lowestPrice)}
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Liên hệ để biết giá</span>
            )}
          </div>
          <button
            onClick={() => (window.location.href = "/booking")}
            className="text-xs bg-red-50 text-red-600 font-semibold px-3 py-1.5 rounded-full hover:bg-red-600 hover:text-white transition-colors"
          >
            Chọn ngay
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCombos, setLoadingCombos] = useState(true);

  const handleBooking = () => navigate(isLoggedIn ? "/booking" : "/login");
  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  useEffect(() => {
    getServicesForCustomer()
      .then((data) =>
        setServices(
          Array.isArray(data) ? data.filter((s) => s.isActive).slice(0, 8) : [],
        ),
      )
      .catch(() => setServices([]))
      .finally(() => setLoadingServices(false));

    getCombosForCustomer(8, 0)
      .then((res) =>
        setCombos(
          Array.isArray(res?.data) ? res.data.filter((c) => c.isActive) : [],
        ),
      )
      .catch(() => setCombos([]))
      .finally(() => setLoadingCombos(false));
  }, []);

  return (
    <div className="bg-white text-gray-800 min-h-screen">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <NavLink
            to="/"
            className="text-2xl font-black text-red-600 uppercase tracking-tight"
          >
            Shop2banh
          </NavLink>

          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <NavLink to="/" className="hover:text-red-600 transition-colors">
              Trang chủ
            </NavLink>
            <NavLink
              to="/services"
              className="hover:text-red-600 transition-colors"
            >
              Dịch vụ
            </NavLink>
            <NavLink
              to="/combo"
              className="hover:text-red-600 transition-colors"
            >
              Combo
            </NavLink>
            <NavLink
              to="/blog"
              className="hover:text-red-600 transition-colors"
            >
              Blog
            </NavLink>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-gray-700 hover:text-red-600 transition-colors focus:outline-none"
                >
                  <CircleUser size={24} strokeWidth={1.5} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                    <NavLink
                      to="/history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-600 transition-colors"
                    >
                      Hồ sơ
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
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hidden md:block hover:bg-red-700 transition-colors"
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </header>

      {/* ── BANNER SLIDER ── */}
      <section className="relative">
        <style>{`
          .banner-swiper .swiper-pagination-bullet {
            background: rgba(255,255,255,0.6);
            width: 8px; height: 8px;
            opacity: 1;
          }
          .banner-swiper .swiper-pagination-bullet-active {
            background: #fff;
            width: 24px;
            border-radius: 4px;
          }
          .banner-swiper .swiper-button-prev,
          .banner-swiper .swiper-button-next {
            color: white;
            width: 40px; height: 40px;
            background: rgba(0,0,0,0.4);
            border-radius: 50%;
            backdrop-filter: blur(4px);
          }
          .banner-swiper .swiper-button-prev::after,
          .banner-swiper .swiper-button-next::after {
            font-size: 14px;
            font-weight: 900;
          }
        `}</style>

        <Swiper
          className="banner-swiper"
          modules={[Autoplay, Pagination]}
          autoplay={{
            delay: 4500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{ clickable: true }}
          loop
          speed={700}
        >
          {banners.map((slide) => (
            <SwiperSlide key={slide.id}>
              <div className="relative h-[520px] md:h-[600px] overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`}
                />

                <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
                  <div className="max-w-lg">
                    <span className="inline-block bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4">
                      {slide.badge}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight whitespace-pre-line drop-shadow-lg">
                      {slide.title}
                    </h1>
                    <p className="mt-4 text-gray-200 text-base leading-relaxed">
                      {slide.desc}
                    </p>
                    <div className="mt-7 flex gap-3"></div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* ── DỊCH VỤ NỔI BẬT ── */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <SectionTitle label="Dịch vụ" title="Dịch vụ sửa chữa & bảo dưỡng" />
          <NavLink
            to="/services"
            className="hidden md:flex items-center gap-1 text-red-600 text-sm font-semibold hover:gap-2 transition-all"
          >
            Xem tất cả <ChevronRight size={16} />
          </NavLink>
        </div>

        {loadingServices ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Wrench className="mx-auto mb-3 text-gray-300" size={40} />
            <p>Chưa có dịch vụ nào</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        <div className="mt-6 text-center md:hidden">
          <NavLink
            to="/services"
            className="text-red-600 font-semibold text-sm"
          >
            Xem tất cả dịch vụ →
          </NavLink>
        </div>
      </section>

      {/* ── COMBO ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <SectionTitle label="Combo tiết kiệm" title="Combo" />
            <NavLink
              to="/combo"
              className="hidden md:flex items-center gap-1 text-red-600 text-sm font-semibold hover:gap-2 transition-all"
            >
              Xem tất cả <ChevronRight size={16} />
            </NavLink>
          </div>

          {loadingCombos ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : combos.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Package className="mx-auto mb-3 text-gray-300" size={40} />
              <p>Chưa có combo nào</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {combos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Sẵn sàng chăm sóc xế yêu của bạn?
        </h2>
        <p className="text-gray-500 mb-7">
          Đặt lịch ngay hôm nay — nhanh chóng, tiện lợi, không chờ đợi.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={handleBooking}
            className="bg-red-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
          >
            Đặt lịch ngay
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
