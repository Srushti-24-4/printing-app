import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const { cart, removeFromCart, updateQuantity, checkout, clearCart } = useCart();
  const [printOrders, setPrintOrders] = useState([]);
  const navigate = useNavigate();
  const API_BASE_URL = "http://127.0.0.1:5000";

  // 1. Fetch only the CURRENT user's prints from the DB
  useEffect(() => {
    const fetchUserPrints = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/user/orders/${user.moodle_id}`);
        const data = await response.json();
        // Show prints that are either being worked on or ready for pickup
        setPrintOrders(data.filter(o => o.status === "Pending" || o.status === "Done"));
      } catch (error) {
        console.error("Error fetching print orders:", error);
      }
    };
    fetchUserPrints();
  }, []);

  // 2. Calculations
  const stationeryTotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const printingTotal = printOrders.reduce((sum, order) => sum + parseFloat(order.price || 0), 0);
  const grandTotal = stationeryTotal + printingTotal;

  // 3. The Combined Checkout Trigger
  const handleFinalCheckout = async () => {
    if (cart.length === 0 && printOrders.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const success = await checkout(); // This pushes React items to MySQL
    if (success) {
      alert(`Order Synced! Final Bill: ₹${grandTotal.toFixed(2)}`);
      navigate("/my-orders"); // View the final token/QR code
    }
  };

  return (
    <div className="cart-container">

      <div className="cart-content">
        <h1>Final Bill Summary</h1>

        {/* Section: Stationery */}
        <div className="cart-section">
          <h3>Stationery Items (In Cart)</h3>
          {cart.length === 0 ? (
            <p className="empty-msg">No stationery items selected.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <span><b>{item.name}</b></span>
                  <span className="item-price">₹{item.price} each</span>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span className="qty-number">{item.quantity || 1}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
                <div className="item-subtotal">₹{(item.price * (item.quantity || 1)).toFixed(2)}</div>
                <button onClick={() => removeFromCart(item.id)} className="remove-btn-icon">✕</button>
              </div>
            ))
          )}
        </div>

        {/* Section: Printing */}
        <div className="cart-section">
          <h3>Pending Printing Orders (From Database)</h3>
          {printOrders.length === 0 ? (
            <p className="empty-msg">No active print jobs found.</p>
          ) : (
            printOrders.map((order) => (
              <div key={order.id} className="cart-item print-item">
                <div className="item-info">
                  <span>📄 {order.file_name || "Document"}</span>
                  <span className="print-details">Status: {order.status}</span>
                </div>
                <div className="item-subtotal">₹{parseFloat(order.price || 0).toFixed(2)}</div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary */}
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
          
          <button className="checkout-btn" onClick={handleFinalCheckout}>
            Sync & Pay ₹{grandTotal.toFixed(2)} at Counter
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;