import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./StudentDashboard.css";

function PrintingPage() {
  const [file, setFile] = useState(null);
  const [copies, setCopies] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Cleanup preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const analyzePDF = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('copies', copies);
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/order', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      setPageCount(data.pages);
      setTotalPrice(data.total);
      alert(`✅ ${data.pages} pages × ₹2 × ${copies} copies = ₹${data.total}`);
      
    } catch (error) {
      // Fallback estimation (roughly 400kb per page for standard PDFs)
      const estimated = Math.max(1, Math.round(file.size / 1024 / 400));
      setPageCount(estimated);
      setTotalPrice(estimated * 2 * copies);
      alert(`⚠️ Backend offline - Estimated ${estimated} pages`);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      setPageCount(0);
      setTotalPrice(0);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleCopiesChange = (e) => {
    const val = Number(e.target.value);
    setCopies(val > 0 ? val : 1);
    if (pageCount > 0) {
      setTotalPrice(pageCount * 2 * (val > 0 ? val : 1));
    }
  };

  const generateOrderId = () => String(Math.floor(Math.random() * 90000) + 10000);

  const placeOrder = () => {
    if (!file || totalPrice === 0) {
        alert("Please analyze the file first to get the total price.");
        return;
    }
    
    const orderId = generateOrderId();
    const order = {
      id: orderId,
      type: "Print",
      fileName: file.name,
      pages: pageCount,
      copies: copies,
      total: totalPrice,
      status: "Pending",
      timestamp: new Date().toLocaleString()
    };
    
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.unshift(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    alert("Order Placed Successfully!");
    navigate("/my-orders");
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <h2>Campus Stationery</h2>
        <div className="nav-links">
          <Link to="/student-dashboard"><span>Products</span></Link>
          <Link to="/printing"><span className="active">Printing</span></Link>
          <Link to="/my-orders"><span>My Orders</span></Link>
          <Link to="/cart"><span>🛒</span></Link>
          <span>👤</span>
        </div>
      </div>
      
      <div className="banner">
        <h1>Printing Services (₹2/page)</h1>
        <p>Upload PDF → Auto page count → Instant price</p>
      </div>
      
      <div className="printing-card" style={{ maxWidth: "600px", margin: "2rem auto", padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        <div className="upload-section" style={{ border: "2px dashed #ccc", padding: "2rem", textAlign: "center", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange} 
            id="fileInput"
            style={{ display: "none" }}
          />
          <label htmlFor="fileInput" style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}>
            {file ? `📄 ${file.name}` : "Click to upload PDF"}
          </label>
        </div>

        {file && (
          <div className="controls">
            <div style={{ marginBottom: "1rem" }}>
              <label>Number of Copies: </label>
              <input 
                type="number" 
                value={copies} 
                onChange={handleCopiesChange} 
                min="1"
                style={{ width: "60px", padding: "5px", marginLeft: "10px" }}
              />
            </div>

            <button 
              onClick={analyzePDF} 
              disabled={loading}
              className="btn-primary"
              style={{ width: "100%", padding: "10px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", marginBottom: "1rem" }}
            >
              {loading ? "Analyzing..." : "Analyze PDF & Get Price"}
            </button>

            {totalPrice > 0 && (
              <div className="price-summary" style={{ padding: "15px", background: "#f8f9fa", borderRadius: "5px", marginBottom: "1rem", textAlign: "center" }}>
                <p><strong>Pages:</strong> {pageCount}</p>
                <p><strong>Total Price:</strong> ₹{totalPrice}</p>
              </div>
            )}

            <button 
              onClick={placeOrder}
              disabled={totalPrice === 0}
              style={{ width: "100%", padding: "10px", backgroundColor: totalPrice === 0 ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              Confirm Order
            </button>
          </div>
        )}

        {previewUrl && (
          <div className="preview-section" style={{ marginTop: "2rem" }}>
            <h3>Preview</h3>
            <iframe 
              src={previewUrl} 
              title="PDF Preview" 
              width="100%" 
              height="400px" 
              style={{ border: "1px solid #ddd", borderRadius: "5px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default PrintingPage;