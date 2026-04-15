import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ShopkeeperDashboard.css";

function ShopkeeperDashboard() {
  const [orders, setOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const API_BASE_URL = "http://127.0.0.1:5000";



const clearDoneOrders = async () => {
  if (window.confirm("Are you sure you want to clear all completed orders from history?")) {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/admin/orders/clear-completed", {
        method: "DELETE",
      });
      if (response.ok) {
        alert("History Cleared!");
        loadOrders(); // Refresh the list
      }
    } catch (error) {
      console.error("Error clearing orders:", error);
    }
  }
};




  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
      const data = await response.json();
      setOrders(data);

      // Stats Calculation - Use "total" because that's what Flask sends
      const pending = data.filter(o => o.status === "Pending").length;
      const completed = data.filter(o => o.status === "Done").length;
      
      // FIX: Changed o.price to o.total
      const revenue = data.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

      setPendingCount(pending);
      setCompletedToday(completed);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error("Backend Error: Check if Flask is running.");
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 2000); // Polling for real-time updates
    return () => clearInterval(interval);
  }, []);

  const handleDownload = (filename) => {
    if (!filename) return alert("File not found");
    window.open(`${API_BASE_URL}/api/download/${filename}`, "_blank");
  };

  const markCompleted = async (orderId) => {
    try {
      // Update Database
      const res = await fetch(`${API_BASE_URL}/api/order/complete/${orderId}`, { method: 'POST' });
      if (res.ok) {
        // Update Local State immediately for smooth UI
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "Done" } : o));
      }
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  const pendingOrders = orders.filter(o => o.status === "Pending");
  const completedOrders = orders.filter(o => o.status === "Done");

  return (
    <div className="shop-container">
      {/* Navbar */}
      <div className="shop-navbar">
        <h2>Shopkeeper Dashboard</h2>
        <div className="nav-links">
          <Link to="/shopkeeper-dashboard" style={{textDecoration: 'none'}}>
            <span className="active">Orders Queue</span>
          </Link>
          
          <button className="clear-history-btn" onClick={clearDoneOrders}>
  🗑️ Clear Completed History
</button>
        </div>
      </div>

      {/* Header */}
      <div className="shop-header">
        <h1>Orders Queue</h1>
        <p>Real-time updates: New orders appear automatically</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <p>Pending Orders</p>
          <h2>{pendingCount}</h2>
          <span>Awaiting fulfillment</span>
        </div>
        <div className="stat-card">
          <p>Completed Today</p>
          <h2>{completedToday}</h2>
          <span>Successfully fulfilled</span>
        </div>
        <div className="stat-card">
          <p>Total Revenue</p>
          <h2>₹{totalRevenue.toFixed(2)}</h2>
          <span>All time</span>
        </div>
      </div>

      {/* Pending Orders */}
      <h2 className="section-title">Pending Orders ({pendingCount})</h2>
      
      <div className="pending-box">
        {pendingOrders.length === 0 ? (
          <div className="empty-state">
            <div className="check">✔</div>
            <p>All caught up!</p>
            <span>No pending orders at the moment</span>
          </div>
        ) : (
          pendingOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>PRINT #{order.token || order.id}</h3>
                <span className="order-time">Active</span>
              </div>
              
              <div className="order-details">
                <p>📄 <strong>File:</strong> {order.file}</p>
                <p>📊 {order.pages} pages × {order.copies} copies</p>
                <p><strong>Total: ₹{order.price.toFixed(2)}</strong></p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <button 
                  className="complete-btn" 
                  style={{ background: "linear-gradient(45deg, #667eea, #764ba2)" }}
                  onClick={() => handleDownload(order.file)}
                >
                  Download PDF
                </button>
                <button 
                  className="complete-btn" 
                  onClick={() => markCompleted(order.id)}
                >
                  Mark as Done
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recently Completed */}
      <h2 className="section-title">Recently Completed</h2>
      <div className="completed-list">
        {completedOrders.length === 0 ? (
          <p style={{ textAlign: "center", color: "#718096" }}>No orders completed yet today.</p>
        ) : (
          completedOrders.slice().reverse().slice(0, 5).map(order => (
            <div key={order.id} className="completed-item">
              PRINT #{order.token || order.id} — ₹{order.price.toFixed(2)} — COMPLETED
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ShopkeeperDashboard;