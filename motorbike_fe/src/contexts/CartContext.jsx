import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "shop2banh_cart_v1";

const CartContext = createContext(null);

const readStorage = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = (items) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStorage);

  useEffect(() => {
    writeStorage(items);
  }, [items]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) return;
      setItems(readStorage());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addItem = (item) => {
    if (!item?.key) return;
    setItems((prev) => {
      if (prev.some((existing) => existing.key === item.key)) return prev;
      return [...prev, item];
    });
  };

  const removeItem = (key) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setItems([]);

  const itemsCount = items.length;

  const serviceIdsFromCart = useMemo(() => {
    const ids = [];
    items.forEach((item) => {
      if (item.type === "service" && item.id != null) {
        ids.push(item.id);
        return;
      }
      if (item.type === "combo" && Array.isArray(item.services)) {
        item.services.forEach((service) => {
          if (service?.id != null) ids.push(service.id);
        });
      }
    });
    return Array.from(new Set(ids));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      itemsCount,
      addItem,
      removeItem,
      clearCart,
      serviceIdsFromCart,
    }),
    [items, itemsCount, serviceIdsFromCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
