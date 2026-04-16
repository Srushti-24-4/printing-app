import React, { useState, useEffect } from "react";
import "./ShopkeeperDashboard.css";

const getCountdown = (readyAt) => {
  if (!readyAt) return null;
  const expiryTime = new Date(new Date(readyAt).getTime() + 2 * 60 * 60 * 1000); 
  const now = new Date();
  const diff = expiryTime - now;

  if (diff <= 0) return { text: "EXPIRED", urgent: true };
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  return { text: `${mins}m ${secs}s left`, urgent: mins < 15 };
};

function ShopkeeperDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ pending: 0, completed: 0, revenue: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [newItem, setNewItem] = useState({ 
    name: "", 
    price: "", 
    category: "Writing", 
    stock: ""
  });
  const [renderTrigger, setRenderTrigger] = useState(0);

  const API_BASE_URL = "http://127.0.0.1:5000";

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/orders`);
      const data = await response.json();
      setOrders(data);

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
    const dataInterval = setInterval(loadOrders, 5000); 
    const timerInterval = setInterval(() => setRenderTrigger(t => t + 1), 1000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newItem.name);
    formData.append("price", newItem.price);
    formData.append("category", newItem.category);
    formData.append("stock", newItem.stock);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/inventory/add`, {
        method: "POST",
        body: formData, // Sending FormData to handle the file upload
      });
      if (response.ok) {
        alert("Item added successfully!");
        setShowAddForm(false);
        setNewItem({ name: "", price: "", category: "Writing", stock: "" });
        setImageFile(null);
      }
    } catch (err) { alert("Failed to add item"); }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus })
      });
      loadOrders();
    } catch (error) { console.error("Update Failed"); }
  };

  return (
    <div className="shop-container">
      <div className="shop-navbar">
        <div className="nav-info">
            <h2>Shopkeeper Hub</h2>
            <p>Admin Portal | Campus Stationery</p>
        </div>
        <div className="nav-stats">
          <div className="stat-pill">Pending: <strong>{stats.pending}</strong></div>
          <div className="stat-pill">Revenue: <strong>₹{(stats.revenue || 0).toFixed(2)}</strong></div>
          <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "✖ Close" : "➕ Add Item"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="inventory-panel animated-fade">
          <h3>Add New Inventory Item</h3>
          <form className="inventory-form" onSubmit={handleAddItem}>
            <div className="form-row">
                <input 
                  placeholder="Item Name" 
                  value={newItem.name} 
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Price (₹)" 
                  value={newItem.price} 
                  onChange={(e) => setNewItem({...newItem, price: e.target.value.replace(/[^0-9.]/g, '')})} 
                  required 
                />
            </div>
            <div className="form-row">
                <select value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}>
                    <option value="Writing">Writing (Pens/Pencils)</option>
                    <option value="Sheets">Sheets (Ruled/Plain)</option>
                    <option value="Files">Files & Folders</option>
                    <option value="Other">Other</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Stock Qty" 
                  value={newItem.stock} 
                  onChange={(e) => setNewItem({...newItem, stock: e.target.value.replace(/[^0-9]/g, '')})} 
                  required 
                />
            </div>
            
            <div className="file-upload-box">
                <label>Product Image:</label>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])} 
                />
            </div>

            <button type="submit" className="save-btn">Save to Inventory</button>
          </form>
        </div>
      )}

      <div className="order-grid">
        {orders.length > 0 ? orders.map((order) => {
          const countdown = getCountdown(order.ready_at);
          return (
            <div key={order.id} className={`shop-card ${order.status === 'Done' ? 'done-card' : ''}`}>
              <div className="card-header">
                <span className="moodle-id">#{order.moodle_id}</span>
                <span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
              </div>

              <div className="card-content">
                {order.prints?.length > 0 && (
                  <div className="detail-section">
                    <h4>📄 Print Requests</h4>
                    {order.prints.map((p, i) => (
                      <div key={i} className="list-item">
                        <span>{p.file} <small>({p.copies}x)</small></span>
                        <button className="dl-icon" onClick={() => window.open(`${API_BASE_URL}/api/download/${p.file}`)}>⬇</button>
                      </div>
                    ))}
                  </div>
                )}

                {order.items?.length > 0 && (
                  <div className="detail-section">
                    <h4>🛒 Stationery Items</h4>
                    <ul>
                      {order.items.map((item, i) => (
                        <li key={i} className="list-item">
                          {item.name} <span className="qty-tag">x{item.qty}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {order.status === "Done" && countdown && (
                    <div className={`timer-box ${countdown.urgent ? 'urgent' : ''}`}>
                      ⏳ {countdown.text}
                    </div>
                )}
              </div>

              <div className="card-footer">
                <div className="card-price">₹{(order.total || 0).toFixed(2)}</div>
                {order.status === "Pending" ? (
                  <button className="action-btn ready" onClick={() => updateStatus(order.id, "Done")}>Mark Ready</button>
                ) : (
                  <button className="action-btn collect" onClick={() => updateStatus(order.id, "Collected")}>Collected</button>
                )}
              </div>
            </div>
          );
        }) : <p className="empty-msg">No active orders found.</p>}
      </div>
    </div>
  );
}

export default ShopkeeperDashboard;