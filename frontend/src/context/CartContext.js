import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("cart");
    if (saved) {
      try { setCart(JSON.parse(saved)); } 
      catch (e) { console.error("Error parsing cart", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

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

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((p) =>
          p.id === productId ? { ...p, quantity: p.quantity - 1 } : p
        );
      }
      return prev.filter((p) => p.id !== productId);
    });
  };

  // ✅ Required for Cart.js plus/minus buttons
  const updateQuantity = (productId, amount) => {
    if (amount === -1) {
      removeFromCart(productId);
    } else {
      const item = cart.find(p => p.id === productId);
      if (item) addToCart(item);
    }
  };

  const clearCart = () => setCart([]);

  // ✅ Added the Checkout function that was missing!
  const checkout = async () => {
    const userString = localStorage.getItem("user");
    if (!userString) {
      alert("Please login first!");
      return false;
    }

    const user = JSON.parse(userString);
    try {
      for (const item of cart) {
        const formData = new FormData();
        formData.append("moodle_id", user.moodle_id);
        formData.append("item_name", item.name);
        formData.append("item_price", item.price);
        formData.append("item_qty", item.quantity || 1);

        const response = await fetch("http://127.0.0.1:5000/api/order", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error(`Failed to sync ${item.name}`);
      }
      clearCart();
      return true;
    } catch (error) {
      console.error("Checkout error:", error);
      return false;
    }
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        clearCart, 
        checkout // 👈 THIS MUST BE EXPORTED HERE
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);