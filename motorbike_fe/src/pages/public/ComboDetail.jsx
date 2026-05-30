import { CircleUser } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import {
  getComboByIdForCustomer,
  getCombosForCustomer,
} from "../../api/combosService";
import CartBadge from "../../components/CartBadge";
import { useCart } from "../../contexts/CartContext";

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getComboPrice = (combo) => {
  const total =
    combo?.services?.reduce(
      (sum, service) => sum + Number(service.priceManual || 0),
      0,
    ) || 0;
  const discount = combo?.discountPct ? Number(combo.discountPct) : 0;
  return total - (total * discount) / 100;
};

const ComboDetail = () => {
  const { id } = useParams();
  const isLoggedIn = !!getToken();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [combo, setCombo] = useState(null);
  const [popularCombos, setPopularCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCart();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [comboData, popularData] = await Promise.all([
        getComboByIdForCustomer(id),
        getCombosForCustomer(6, 0, "newest"),
      ]);
      setCombo(comboData);
      setPopularCombos(popularData.data || []);
    } catch (error) {
      console.error("Error fetching combo detail:", error);
    } finally {
      setLoading(false);
    }
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

  const isInCart = useMemo(() => {
    if (!combo?.id) return false;
    return items.some((item) => item.key === `combo-${combo.id}`);
  }, [items, combo?.id]);

  const handleAddToCart = () => {
    if (!combo?.isActive) return;
    if (isInCart) {
      toast("Combo đã có trong giỏ hàng.");
      return;
    }
    addItem({
      key: `combo-${combo.id}`,
      type: "combo",
      id: combo.id,
      name: combo.comboName,
      discountPct: combo.discountPct,
      imageUrl: combo.imageUrl,
      services: Array.isArray(combo.services)
        ? combo.services.map((service) => ({
            id: service.id,
            name: service.serviceName,
            priceManual: service.priceManual,
            durationMinutes: service.durationMinutes,
          }))
        : [],
    });
    toast.success("Đã thêm combo vào giỏ hàng.");
  };

  return (
    <div className="bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <NavLink
            to={"/"}
            className="text-2xl font-black text-red-600 uppercase"
          >
            Shop2banh
          </NavLink>

          {/* Wrapper chứa Icons và Nút đặt lịch */}
          <div className="flex items-center gap-5">
            <CartBadge />

            {/* Icon User với Dropdown - chỉ hiện khi đã login */}
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

      {/* Main */}
      <main className="bg-white">
        <div className="bg-gray-100 py-2">
          <div className="max-w-[1200px] mx-auto px-[15px] text-xs text-gray-500">
            <NavLink to={"/"} className="hover:text-[#D73417]">
              Trang chủ
            </NavLink>{" "}
            &gt;
            <NavLink to={"/combo"} className="hover:text-[#D73417] ml-1 mr-1">
              Combo
            </NavLink>
            &gt;
            <span className="text-gray-800 ml-1">
              {combo?.comboName || "Chi tiết combo"}
            </span>
          </div>
        </div>
        {/* END: Breadcrumbs */}

        {loading ? (
          <div className="max-w-[1200px] mx-auto px-[15px] py-20 text-center text-gray-500">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="max-w-[1200px] mx-auto px-[15px] py-8">
            <div className="grid grid-cols-12 gap-8">
              {/* BEGIN: Left Column (Gallery & Description) */}
              <div className="col-span-12 lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Main Product Image */}
                  <div data-purpose="product-gallery">
                    <div className="border border-gray-200 relative group h-[350px] md:h-[450px] flex items-center justify-center bg-gray-50 overflow-hidden">
                      {combo?.imageUrl ? (
                        <img
                          alt={combo.comboName}
                          className="max-w-full max-h-full object-contain p-2"
                          src={combo.imageUrl}
                        />
                      ) : (
                        <span className="text-gray-400 font-medium">
                          Đang Cập Nhật
                        </span>
                      )}
                    </div>

                    {/* List ảnh nhỏ */}
                    <div className="flex mt-4 space-x-2 overflow-x-auto">
                      <img
                        className="w-16 h-16 border border-[#D73417] object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpYtc5zziN0bfOfwvdDQ3hp6m241ApxBnA9A8Na6NZWTRDaUHTTtYvKXtDl2yLgvMG21KAjo52LpNexCP6otbGHI3AurS7jePSolQR7PbyrhWurW5T7hfv7gNb4bzUNF9v3nF7bFqOU4Dk6uWwcD_1VhOcM-Bb7RpJIJVfWqll9GU87fXteH5d6azZOTwZMH6o5Wo2LerD_6LW889yvYAWKA2UEubtAbrHT0w2ttX-L_f_OPKnHCDXhz8xHkD7vAvAcbk29qu-QtM"
                        alt="Thumb 1"
                      />
                      <img
                        className="w-16 h-16 border border-gray-200 object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqTp1lz1B80H0aJnFN6bfW023ECNih0OyE6kzTnjHojkP8ueM1TCmWcwiXHEXie3D5BP83I7DeJLJ0W_jMofuUStFZvHA1wT-JCQQQceur_45am5F33qKDn5zlqzeFCFXjR_PhczytBpiMaDzoTMAV2ES6zQt2wwAmORSP47h9BbKbl_i05tNnIuUglVk7kD8iT2r_5_LL3eNHCOF3lqZu-_Jeq4pAuz-NXvoXcedafcOSDbCTEuM6ebteBAuJcS4Jh4W91Z9iB2E"
                        alt="Thumb 2"
                      />
                      <img
                        className="w-16 h-16 border border-gray-200 object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfbkuswd8jEyC6sMuU6Oa1r6ylS8qDHp6Ga73GhJyAR8ESXY4oLms_h5C3QPHt-aPyjw26Oaw68L01f9W3PXyX05lRMTGFDQMJvkRZ6s4255EhgBVOAbxi0L6sj7Y_UT2Ui3gVd6j7dxKcKIC9t9uQc0vEf3XZirJrdbZSztCoDxN13OUF-DKNhs5Oda8LzK9yS44PveGROb6tI1jR5fZkJWupHi34EXZC1Yv7jGZdz8L9N6vnfQGL5Xh5QS6VCmsv2eNeanQg1To"
                        alt="Thumb 3"
                      />
                      <img
                        className="w-16 h-16 border border-gray-200 object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTA9kGyJDPvgsjCeKNI84g_BD6j5c_3YjT2catDMEQzvYb32Xfn_Mn1RUblMZjcrHaDYrk3BfLd3T4gSdo9ALgMOd7cZX8vB06Du76YwruJuY8cAw0zLS7V0W38LEPsIFqyC3suaKiLTYLh-lNJAAZnVbETTOyjrIqqGwFXdw6z9iVIv8keE352Sgv5SuFFSRcEW96i09doJByQPZwkF5u_UAgB_65w3Nf9HTRrj25D9AjBPE7GZMxToZhPRkAguZH7yveC7ir3N0"
                        alt="Thumb 4"
                      />
                    </div>
                  </div>

                  {/* Product Summary */}
                  <div data-purpose="product-summary">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                      {combo?.comboName}
                    </h1>
                    <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">
                      {combo?.description}
                    </p>
                    <div className="text-3xl font-bold text-[#D73417] mb-4">
                      {formatPrice(getComboPrice(combo))}
                    </div>
                    <div className="flex items-center space-x-4 mb-4 text-sm">
                      <span className="text-gray-500">Tình trạng:</span>
                      {combo?.isActive ? (
                        <span className="text-green-600 font-semibold">
                          ✔ Đang kinh doanh
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">
                          ✖ Ngừng kinh doanh
                        </span>
                      )}
                    </div>

                    {combo?.isActive ? (
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
                        className="w-full bg-gray-400 text-white font-bold py-4 rounded text-xl uppercase shadow-md cursor-not-allowed"
                      >
                        NGỪNG KINH DOANH
                      </button>
                    )}
                  </div>
                </div>

                {/* BEGIN: Tabs */}
                <div className="mt-12">
                  <div className="flex border-b border-gray-200">
                    <button className="px-6 py-3 border-b-2 border-[#D73417] text-[#D73417] font-bold text-sm uppercase">
                      Chi tiết
                    </button>
                  </div>
                  <div
                    className="py-6 text-gray-700 text-sm leading-relaxed whitespace-pre-line"
                    data-purpose="product-details-content"
                  >
                    {combo?.description || "Chưa có thông tin chi tiết."}
                  </div>
                </div>
                {/* END: Tabs */}
              </div>
              {/* END: Left Column */}

              {/* BEGIN: Right Sidebar */}
              <aside className="col-span-12 lg:col-span-3">
                {/* Trending Products */}
                <div className="border border-gray-200 mb-6">
                  <div className="bg-gray-100 px-3 py-2 font-bold text-sm border-b border-gray-200">
                    QUAN TÂM NHIỀU
                  </div>
                  <div className="p-3 space-y-4">
                    {popularCombos && popularCombos.length > 0 ? (
                      popularCombos.map((popular) => (
                        <div
                          key={popular.id}
                          className="flex space-x-3 items-center cursor-pointer"
                          onClick={() => navigate(`/combo/${popular.id}`)}
                        >
                          {popular?.imageUrl ? (
                            <img
                              className="w-12 h-12 object-cover"
                              src={popular.imageUrl}
                              alt={popular.comboName}
                            />
                          ) : (
                            <div className="w-12 h-12 border bg-gray-100 flex items-center justify-center text-center">
                              <span className="text-[8px] text-gray-500">
                                Đang Cập Nhật
                              </span>
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-semibold hover:text-[#D73417] transition-colors">
                              {popular.comboName}
                            </h4>
                            <p className="text-[#D73417] font-bold text-xs mt-1">
                              {formatPrice(getComboPrice(popular))}
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
                </div>
              </aside>
              {/* END: Right Sidebar */}
            </div>
          </div>
        )}
      </main>

      {/* BEGIN: Footer */}
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
};

export default ComboDetail;
