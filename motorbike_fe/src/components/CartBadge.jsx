import { ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

export default function CartBadge({ className = "" }) {
  const { itemsCount } = useCart();

  // Ẩn icon giỏ hàng nếu user chưa đăng nhập
  const isLoggedIn =
    !!localStorage.getItem("customer_token") ||
    !!localStorage.getItem("access_token");

  if (!isLoggedIn) return null;

  return (
    <NavLink
      to="/cart"
      className={`relative text-gray-700 hover:text-red-600 transition-colors ${className}`}
      aria-label="Giỏ hàng"
    >
      <ShoppingCart size={22} strokeWidth={1.5} />
      {itemsCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {itemsCount > 99 ? "99+" : itemsCount}
        </span>
      )}
    </NavLink>
  );
}
