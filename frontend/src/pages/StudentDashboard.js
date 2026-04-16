import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./StudentDashboard.css";


// Updated API Base URL
const API_BASE_URL = "http://127.0.0.1:5000";

function ProductCard({ item, quantity, onIncrement, onDecrement }) {
  return (
    <div className={`product-card ${item.isUrgent ? "urgent-border" : ""}`}>
      {item.isUrgent && <span className="urgent-badge">High Demand</span>}
      <div className="image-container">
        {/* UPDATED: Points to the Flask upload route with a fallback */}
        <img 
          src={`${API_BASE_URL}/api/uploads/${item.image}`} 
          alt={item.name} 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
          }}
        />
      </div>
      <div className="product-info">
        <h3>{item.name}</h3>
        <p className="category-label">{item.category}</p>
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

export default function StudentDashboard() {
  const { cart, addToCart, removeFromCart } = useCart();
  const [filter, setFilter] = useState("All");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/items`)
      .then(res => res.json())
      .then(data => {
        const formattedProducts = data.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          category: item.category || "Other",
          isUrgent: item.stock < 10,
          // Store only the filename from the DB
          image: item.image 
        }));
        setProducts(formattedProducts);
      })
      .catch(err => console.error("Error loading inventory:", err));
  }, []);

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
        {/* Updated categories to match your Shopkeeper selection */}
        {["All", "Writing", "Sheets", "Files", "Other"].map(cat => (
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
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => {
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
          })
        ) : (
          <p className="no-products">No items found in this category.</p>
        )}
      </div>

      {totalItems > 0 && (
        <div className="floating-cart-bar">
          <div className="cart-info">
            <span className="item-count">{totalItems} Items selected</span>
            <span className="total-amt">₹{totalPrice.toFixed(2)}</span>
          </div>
          <Link to="/cart" className="checkout-btn">Proceed to Cart →</Link>
        </div>
      )}
    </div>
  );
}