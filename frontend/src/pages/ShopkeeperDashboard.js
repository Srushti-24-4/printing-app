import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ShopkeeperDashboard.css";

function ShopkeeperDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, revenue: 0 });
  const API_BASE_URL = "http://127.0.0.1:5000";

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
      const data = await response.json();
      setOrders(data);

      // Stats Calculation
      const pending = data.filter(o => o.status === "Pending").length;
      const completed = data.filter(o => o.status === "Done").length;
      const revenue = data.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      setStats({ pending, completed, revenue });
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000); 
    return () => clearInterval(interval);
  }, []);

  const handleDownload = (filename) => {
    if (!filename) return alert("No file found");
    window.open(`${API_BASE_URL}/api/download/${filename}`, "_blank");
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      });
      if (res.ok) loadOrders();
    } catch (error) {
      console.error("Status Update Failed");
    }
  };

  return (
    <div className="shop-container">
      <div className="shop-navbar">
        <h2>Shopkeeper Hub</h2>
        <div className="nav-stats">
          <span>Pending: <strong>{stats.pending}</strong></span>
          <span>Revenue: <strong>₹{stats.revenue.toFixed(2)}</strong></span>
        </div>
      </div>

      <div className="order-grid">
        {orders.filter(o => o.status === "Pending").map((order) => (
          <div key={order.id} className="shop-card">
            <div className="card-header">
              <span className="moodle-id">ID: {order.moodle_id}</span>
              <span className="status-label">{order.status}</span>
            </div>

            <div className="card-content">
              {/* 1. PRINT DETAILS */}
              {order.prints && order.prints.length > 0 && (
                <div className="detail-section">
                  <h4>📄 Documents to Print</h4>
                  {order.prints.map((p, idx) => (
                    <div key={idx} className="print-item">
                      <div className="file-info">
                        <p className="file-name">{p.file}</p>
                        <p className="file-meta">{p.copies} copies</p>
                      </div>
                      <button 
                        className="dl-btn" 
                        onClick={() => handleDownload(p.file)}
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. STATIONERY DETAILS */}
              {order.items && order.items.length > 0 && (
                <div className="detail-section">
                  <h4>🛒 Stationery Items</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} <span className="qty-tag">x{item.qty}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="card-footer">
              <div className="price-tag">Total: ₹{order.total.toFixed(2)}</div>
              <button 
                className="ready-btn" 
                onClick={() => updateStatus(order.id, "Done")}
              >
                Mark Ready
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShopkeeperDashboard;