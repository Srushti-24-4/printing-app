import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const API_BASE_URL = "http://127.0.0.1:5000";

  // 1. Function to fetch orders from the database
  const fetchMyOrders = async () => {
    try {
      // We fetch all orders. In a real app, you'd filter by Student ID
      const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
      const data = await response.json();
      
      // Sort by latest first
      const sortedData = data.sort((a, b) => b.id - a.id);
      setOrders(sortedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // 2. Set up real-time polling
  useEffect(() => {
    fetchMyOrders(); // Initial load
    const interval = setInterval(fetchMyOrders, 2000); // Check for status changes every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="orders-container">
      {/* Navbar */}
      <div className="navbar">
        <h2 className="logo">Campus Stationery</h2>
        <div className="nav-right">
          <div className="nav-links">
            <Link to="/student-dashboard"><span>Products</span></Link>
            <Link to="/printing-page"><span>Printing</span></Link>
            <Link to="/my-orders"><span className="active">My Orders</span></Link>
            <Link to="/cart"><span>🛒</span></Link>
            <span>👤</span>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your stationery and print orders in real-time</p>
      </div>

      {/* Orders List */}
      <div className="orders-box">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    {/* Using 'Print' as default type since it's a printing system */}
                    <h3>Print Order</h3>
                    <span className="order-id">TOKEN: {order.token || order.id}</span>
                  </div>
                  {/* Status Badge - will turn from Pending to Done automatically */}
                  <span className={`order-status status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="order-details">
                  <p><strong>📄 File:</strong> {order.file}</p>
                  <p>{order.pages} pages × {order.copies} copies</p>
                  <p className="order-price">Total: ₹{parseFloat(order.price).toFixed(2)}</p>
                </div>
                
                <div className="order-meta">
                  <span className="order-time">
                    {/* Placeholder for timestamp if your DB has it, else 'Recent' */}
                    Status: <strong>{order.status === "Done" ? "Ready for Pickup" : "Processing"}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;