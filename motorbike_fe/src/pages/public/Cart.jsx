import { CircleUser, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import CartBadge from "../../components/CartBadge";
import { useCart } from "../../contexts/CartContext";

const formatPrice = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const getComboPrice = (comboItem) => {
  const total =
    comboItem?.services?.reduce(
      (sum, service) => sum + Number(service.priceManual || 0),
      0,
    ) || 0;
  const discount = Number(comboItem?.discountPct || 0);
  return total - (total * discount) / 100;
};

export default function Cart() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { items, removeItem, clearCart } = useCart();

  const totals = useMemo(() => {
    const totalPrice = items.reduce((sum, item) => {
      if (item.type === "combo") return sum + getComboPrice(item);
      return sum + Number(item.priceManual || 0);
    }, 0);
    return { totalPrice };
  }, [items]);

  const handleBooking = () => {
    if (items.length === 0) return;
    navigate(isLoggedIn ? "/booking" : "/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="font-[Tahoma,Arial,sans-serif] text-[14px] text-[#333] bg-[#f4f4f4] min-h-screen">
      <header className="bg-white py-4 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-[15px] flex flex-wrap items-center justify-between">
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
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-[15px] py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-2/3">
            <div className="flex items-center justify-between border-b-2 border-[#D73417] pb-2 mb-5">
              <h1 className="text-lg font-bold uppercase text-[#D73417]">
                Giỏ hàng dịch vụ
              </h1>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="bg-white border rounded p-8 text-center text-gray-500">
                <p className="font-semibold">Giỏ hàng của bạn đang trống.</p>
                <p className="text-xs mt-1">
                  Hãy chọn dịch vụ hoặc combo trước khi đặt lịch.
                </p>
                <NavLink
                  to="/services"
                  className="inline-block mt-4 bg-[#D73417] text-white px-5 py-2 rounded text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  Xem dịch vụ
                </NavLink>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const itemName =
                    item.name || item.serviceName || item.comboName || "";

                  return (
                    <div
                      key={item.key}
                      className="bg-white border rounded p-4 flex gap-4"
                    >
                      <div className="w-20 h-20 border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 text-center px-1">
                            Đang cập nhật
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase text-gray-400">
                              {item.type === "combo" ? "Combo" : "Dịch vụ"}
                            </p>
                            <h3 className="text-sm font-bold text-gray-800">
                              {itemName}
                            </h3>
                          </div>
                          <button
                            onClick={() => removeItem(item.key)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {item.type === "combo" &&
                          Array.isArray(item.services) && (
                            <div className="mt-2 text-xs text-gray-500">
                              <p className="font-semibold text-gray-600 mb-1">
                                Dịch vụ trong combo:
                              </p>
                              <p className="leading-relaxed">
                                {item.services
                                  .map((service) => service.name)
                                  .filter(Boolean)
                                  .join(" • ") || "Chưa có dịch vụ"}
                              </p>
                            </div>
                          )}

                        <div className="mt-2 text-sm font-bold text-[#D73417]">
                          {item.type === "combo"
                            ? formatPrice(getComboPrice(item))
                            : formatPrice(item.priceManual)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="w-full lg:w-1/3">
            <div className="bg-white border rounded p-5">
              <h2 className="text-sm font-bold uppercase text-gray-700 border-b pb-2">
                Tóm tắt
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tổng dịch vụ</span>
                  <span className="font-semibold">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-[#D73417]">
                    {formatPrice(totals.totalPrice)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={items.length === 0}
                className="w-full mt-5 bg-[#D73417] text-white py-3 rounded text-sm font-bold uppercase hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Đặt lịch sửa chữa
              </button>
              <p className="text-xs text-gray-400 mt-3">
                Dịch vụ trong giỏ hàng sẽ được tự động đưa vào form đặt lịch.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
