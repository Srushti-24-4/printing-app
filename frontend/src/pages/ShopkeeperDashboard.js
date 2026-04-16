import React, { useState, useEffect } from "react";
import "./ShopkeeperDashboard.css";

// --- Time Helper ---
const getCountdown = (readyAt) => {
  if (!readyAt) return null;
  const dateString = readyAt.replace('T', ' ');
  const readyTime = new Date(dateString);
  const expiryTime = new Date(readyTime.getTime() + (2 * 60 * 60 * 1000)); 
  const now = new Date();
  const diff = expiryTime - now;

  if (diff <= 0) return { text: "EXPIRED", urgent: true };
  const totalSeconds = Math.floor(diff / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return { 
    text: `${mins}m ${secs.toString().padStart(2, '0')}s left`, 
    urgent: mins < 15 
  };
};

function ShopkeeperDashboard() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [salesData, setSalesData] = useState({ total_revenue: 0, daily_revenue: 0 });
  const [showAddForm, setShowAddForm] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [newItem, setNewItem] = useState({ name: "", price: "", category: "Writing", stock: "" });
  const [renderTrigger, setRenderTrigger] = useState(0);

  const API_BASE_URL = "http://127.0.0.1:5000";

  // --- Data Loading Functions ---
  const loadOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/orders`);
      const data = await res.json();
      setOrders(data);
    } catch (err) { console.error("Order Load Error", err); }
  };

  const loadInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/items`);
      const data = await res.json();
      setInventory(data);
    } catch (err) { console.error("Inventory Load Error", err); }
  };

  const loadSalesStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sales-stats`);
      const data = await res.json();
      setSalesData(data);
    } catch (err) { console.error("Sales Load Error", err); }
  };

  useEffect(() => {
    loadOrders();
    loadInventory();
    loadSalesStats();
    
    const dataInterval = setInterval(() => {
        loadOrders();
        if(activeTab === "sales") loadSalesStats();
        if(activeTab === "inventory") loadInventory();
    }, 5000);
    
    const timerInterval = setInterval(() => setRenderTrigger(t => t + 1), 1000);
    
    return () => {
      clearInterval(dataInterval);
      clearInterval(timerInterval);
    };
  }, [activeTab]);

  // --- Action Handlers ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(newItem).forEach(key => formData.append(key, newItem[key]));
    if (imageFile) formData.append("image", imageFile);

    const res = await fetch(`${API_BASE_URL}/api/admin/inventory/add`, { method: "POST", body: formData });
    if (res.ok) {
      alert("Item Added!");
      setShowAddForm(false);
      loadInventory();
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    await fetch(`${API_BASE_URL}/api/admin/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status: newStatus })
    });
    loadOrders();
    loadSalesStats(); // Refresh revenue immediately if collected
  };

  const deleteInventoryItem = async (id) => {
    if(window.confirm("Delete this item?")) {
        await fetch(`${API_BASE_URL}/api/admin/inventory/delete/${id}`, { method: 'DELETE' });
        loadInventory();
    }
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h2>Shopkeeper</h2>
          <span>Stationery Hub</span>
        </div>
        <div className="sidebar-menu">
          <button className={activeTab === "orders" ? "active" : ""} onClick={() => setActiveTab("orders")}>📦 Active Orders</button>
          <button className={activeTab === "inventory" ? "active" : ""} onClick={() => setActiveTab("inventory")}>📝 Inventory</button>
          <button className={activeTab === "sales" ? "active" : ""} onClick={() => setActiveTab("sales")}>📊 Daily Sales</button>
        </div>
        <div className="sidebar-footer">
            <div className="mini-stat">Today: ₹{salesData.daily_revenue.toFixed(2)}</div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {activeTab === "orders" && (
          <div className="orders-view animated-fade">
            <header className="view-header">
              <h1>Order Management</h1>
              <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? "✖ Close" : "➕ New Stock Item"}
              </button>
            </header>

            {showAddForm && (
                <form className="inventory-inline-form" onSubmit={handleAddItem}>
                    <input placeholder="Name" onChange={e => setNewItem({...newItem, name: e.target.value})} required />
                    <input placeholder="Price" onChange={e => setNewItem({...newItem, price: e.target.value})} required />
                    <input placeholder="Stock" onChange={e => setNewItem({...newItem, stock: e.target.value})} required />
                    <select onChange={e => setNewItem({...newItem, category: e.target.value})}>
                        <option value="Writing">Writing</option>
                        <option value="Sheets">Sheets</option>
                        <option value="Files">Files</option>
                        <option value="other">Others</option>
                    </select>
                    <input type="file" onChange={e => setImageFile(e.target.files[0])} />
                    <button type="submit">Save</button>
                </form>
            )}

            <div className="order-sections">
                <section className="active-orders">
                    <h3>Needs Action</h3>
                    <div className="shop-grid">
                        {orders.filter(o => o.status === "Pending").map(order => (
                            <OrderCard key={order.id} order={order} updateStatus={updateStatus} API_BASE_URL={API_BASE_URL} />
                        ))}
                    </div>
                </section>

                <section className="ready-orders">
                    <h3>Ready for Pickup</h3>
                    <div className="shop-grid minimized">
                        {orders.filter(o => o.status === "Done").map(order => (
                            <OrderCard key={order.id} order={order} updateStatus={updateStatus} API_BASE_URL={API_BASE_URL} isDone />
                        ))}
                    </div>
                </section>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="inventory-view animated-fade">
            <h1>Stock Levels</h1>
            <table className="inventory-table">
              <thead>
                <tr><th>Item</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>₹{item.price}</td>
                    <td className={item.stock < 10 ? "low-stock" : ""}>{item.stock}</td>
                    <td><button className="del-btn" onClick={() => deleteInventoryItem(item.id)}>🗑</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="sales-view animated-fade">
            <h1>Daily Sales Report</h1>
            <div className="sales-stats-grid">
                <div className="sales-stat-card">
                    <h4>Today's Revenue</h4>
                    <p className="amt">₹{salesData.daily_revenue.toFixed(2)}</p>
                </div>
                <div className="sales-stat-card">
                    <h4>Total Lifetime Revenue</h4>
                    <p className="amt">₹{salesData.total_revenue.toFixed(2)}</p>
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- Sub-Component: Order Card ---
function OrderCard({ order, updateStatus, API_BASE_URL, isDone }) {
    const countdown = getCountdown(order.ready_at);
    return (
        <div className={`shop-card ${isDone ? 'done-style' : ''}`}>
            <div className="card-header">
                <strong>Token #{order.token}</strong>
                <span className="moodle-tag">{order.moodle_id}</span>
            </div>
            <div className="card-body">
                {order.items.map((item, i) => <div key={i}>✏️ {item.name} x{item.qty}</div>)}
                {order.prints.map((p, i) => (
                    <div key={i} className="print-line">
                        📄 {p.file} ({p.copies}x)
                        <button onClick={() => window.open(`${API_BASE_URL}/api/download/${p.file}`)}>⬇</button>
                    </div>
                ))}
            </div>
            {isDone && countdown && (
                <div className={`timer-bar ${countdown.urgent ? 'urgent' : ''}`}>
                    ⏳ {countdown.text}
                </div>
            )}
            <div className="card-footer">
                <span>₹{order.total_price}</span>
                <button 
                    className={isDone ? "btn-collect" : "btn-ready"} 
                    onClick={() => updateStatus(order.id, isDone ? "Collected" : "Done")}
                >
                    {isDone ? "Picked Up" : "Mark Ready"}
                </button>
            </div>
        </div>
    );
}

export default ShopkeeperDashboard;