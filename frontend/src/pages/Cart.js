import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [printOrders, setPrintOrders] = useState([]);
  const API_BASE_URL = "http://127.0.0.1:5000";

  // Fetch Print Orders from MySQL
  useEffect(() => {
    const fetchPrintOrders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
        const data = await response.json();
        // Only include "Pending" prints in the current bill
        setPrintOrders(data.filter(o => o.status === "Done"));
      } catch (error) {
        console.error("Error fetching print orders:", error);
      }
    };
    fetchPrintOrders();
  }, []);

  // --- CALCULATIONS ---
  // Calculates Stationery: (Price * Quantity) for each item
  const stationeryTotal = cart.reduce((sum, item) => {
    const qty = item.quantity || 1;
    return sum + item.price * qty;
  }, 0);

  const printingTotal = printOrders.reduce((sum, order) => sum + parseFloat(order.price), 0);
  const grandTotal = stationeryTotal + printingTotal;

  return (
    <div className="cart-container">
      {/* Navbar */}
      <div className="navbar">
        <h2>Campus Stationery</h2>
        <div className="nav-links">
          <Link to="/student-dashboard">
            <span >Products</span>
          </Link>
          <Link to="/printing-page">
            <span>Printing</span>
          </Link>
          <Link to="/my-orders">
            <span>My Orders</span>
          </Link>
          <Link to="/cart">
            <span className="active">🛒</span>
          </Link>
          <span>👤</span>
        </div>
      </div>

      <div className="cart-content">
        <h1>Final Bill Summary</h1>

        {/* 1. Stationery Items Section */}
        <div className="cart-section">
          <h3>Stationery Items</h3>
          {cart.length === 0 ? (
            <p className="empty-msg">No stationery items in cart.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <span className="item-name"><b>{item.name}</b></span>
                  <span className="item-price">₹{item.price} each</span>
                </div>

                {/* QUANTITY CONTROLS */}
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span className="qty-number">{item.quantity || 1}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>

                <div className="item-subtotal">
                  ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                </div>

                <button 
                  onClick={() => removeFromCart(item.id)} 
                  className="remove-btn-icon"
                  title="Remove Item"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* 2. Printing Orders Section (From Database) */}
        <div className="cart-section">
          <h3>Pending Printing Orders</h3>
          {printOrders.length === 0 ? (
            <p className="empty-msg">No prints are ready yet. Check "My Orders" for status.</p>
          ) : (
            printOrders.map((order) => (
              <div key={order.id} className="cart-item print-item">
                <div className="item-info">
                  <span>📄 {order.file}</span>
                  <span className="print-details">{order.pages} pages × {order.copies} copies</span>
                </div>
                <div className="item-subtotal">
                  ₹{parseFloat(order.price).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 3. Final Bill Summary Card */}
        <div className="bill-summary">
          <div className="bill-row">
            <span>Stationery Subtotal:</span> 
            <span>₹{stationeryTotal.toFixed(2)}</span>
          </div>
          <div className="bill-row">
            <span>Printing Subtotal:</span> 
            <span>₹{printingTotal.toFixed(2)}</span>
          </div>
          <hr />
          <div className="bill-row grand-total">
            <strong>Grand Total:</strong>
            <strong>₹{grandTotal.toFixed(2)}</strong>
          </div>
          
          <button 
            className="checkout-btn" 
            onClick={() => {
                alert(`Order Placed Successfully!\nTotal Amount: ₹${grandTotal.toFixed(2)}`);
                 // Empties stationery cart after "payment"
            }}
          >
            To The Shopkeeper pay ₹{grandTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;