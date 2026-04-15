import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./StudentDashboard.css";

function ProductCard({ item, quantity, onIncrement, onDecrement }) {
  return (
    <div className={`product-card ${item.isUrgent ? "urgent-border" : ""}`}>
      {item.isUrgent && <span className="urgent-badge">High Demand</span>}
      <div className="image-container">
        <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} />
      </div>
      <div className="product-info">
        <h3>{item.name}</h3>
        <p className="price">₹{item.price}</p>
        
        <div className="quantity-controls">
          {quantity === 0 ? (
            <button className="add-btn" onClick={onIncrement}>
              Add to Cart
            </button>
          ) : (
            <div className="stepper">
              <button className="step-btn" onClick={onDecrement}>−</button>
              <span className="qty-number">{quantity}</span>
              <button className="step-btn" onClick={onIncrement}>+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const products = [
  { id: 1, name: "Black Pen", price: 10, category: "Writing", isUrgent: false, image: "/images/black-pen.jpg" },
  { id: 2, name: "Blue Pen", price: 10, category: "Writing", isUrgent: false, image: "/images/blue-pen.jpg" },
  { id: 3, name: "Single Side Ruled Pages", price: 50, category: "Paper", isUrgent: true, image: "/images/single-side.jpeg" },
  { id: 4, name: "Double Side Ruled Pages", price: 60, category: "Paper", isUrgent: false, image: "/images/double-side.jpeg" },
  { id: 5, name: "Transparent Folder", price: 25, category: "Files", isUrgent: false, image: "/images/folder.png" },
  { id: 8, name: "Eraser", price: 5, category: "Writing", isUrgent: false, image: "/images/eraser.jpg" },
  { id: 9, name: "Transparent Scale", price: 15, category: "Writing", isUrgent: false, image: "/images/t-scale.jpg" },
  { id: 10, name: "Steel Scale", price: 20, category: "Writing", isUrgent: false, image: "/images/s-scale.jpg" },
];

export default function StudentDashboard() {
  const { cart, addToCart, removeFromCart } = useCart();
  const [filter, setFilter] = useState("All");

  const safeCart = cart || [];
  const totalItems = safeCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalPrice = safeCart.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);

  const filteredProducts = filter === "All" 
    ? products 
    : products.filter(p => p.category === filter);

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand">Campus Store</div>
        <div className="nav-links">
          <Link to="/printing-page">Printing</Link>
          <Link to="/my-orders">Orders</Link>
          <Link to="/cart" className="cart-nav">
            🛒 {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
          </Link>
        </div>
      </nav>

      <div className="banner">
        <h1>Campus Stationery</h1>
        <p>Your essentials, ready when you are.</p>
      </div>

      <div className="filter-tabs">
        {["All", "Writing", "Paper", "Files"].map(cat => (
          <button 
            key={cat} 
            className={filter === cat ? "tab active" : "tab"} 
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filteredProducts.map((item) => {
          const cartItem = safeCart.find(i => i.id === item.id);
          const currentQty = cartItem ? cartItem.quantity : 0;

          return (
            <ProductCard 
              key={item.id} 
              item={item} 
              quantity={currentQty}
              onIncrement={() => addToCart(item)}
              onDecrement={() => removeFromCart(item.id)}
            />
          );
        })}
      </div>

      {totalItems > 0 && (
        <div className="floating-cart-bar">
          <div className="cart-info">
            <span className="item-count">{totalItems} Items selected</span>
            <span className="total-amt">₹{totalPrice}</span>
          </div>
          <Link to="/cart" className="checkout-btn">Proceed to Cart →</Link>
        </div>
      )}
    </div>
  );
}