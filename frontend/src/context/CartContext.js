import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  // Load from localStorage on startup
  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing cart data", e);
      }
    }
  }, []);

  // Sync to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ADD TO CART: Handles new items vs existing items
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // REMOVE FROM CART: Uses ID for precision
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // UPDATE QUANTITY: Triggered by + and - buttons
  const updateQuantity = (productId, amount) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = (item.quantity || 1) + amount;
          // Only update if qty stays above 0
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  // GET TOTAL: Calculates bill for stationery only
  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  // CLEAR CART: Useful after checkout
  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, getTotal, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);