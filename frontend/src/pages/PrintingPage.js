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
    const validCopies = val > 0 ? val : 1;
    setCopies(validCopies);
    if (pageCount > 0) {
      setTotalPrice(pageCount * 2 * validCopies);
    }
  };

  // ✅ ANALYZE: Sends file to Flask to count pages & create/update the "Pending" order
  const analyzePDF = async () => {
    if (!file) return;
    
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('copies', copies);
    formData.append('moodle_id', user.moodle_id); 
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/order', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setPageCount(data.pages);
        setTotalPrice(data.total);
        alert(`✅ Analysis Complete: ₹${data.total}`);
      } else {
        alert(data.error || "Failed to analyze PDF.");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("⚠️ Backend offline - Using fallback estimation");
      const estimated = Math.max(1, Math.round(file.size / 1024 / 400));
      setPageCount(estimated);
      setTotalPrice(estimated * 2 * copies);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CONFIRM: Since analyzePDF already saved it to DB, we just redirect
  const placeOrder = () => {
    if (!file || totalPrice === 0) {
      alert("Please analyze the file first to get the total price.");
      return;
    }
    
    alert("Print job confirmed and added to your active token!");
    navigate("/my-orders");
  };

  return (
    <div className="dashboard-container">
      <div className="navbar">
        <h2>Campus Stationery</h2>
        <div className="nav-links">
          <Link to="/student-dashboard"><span>Products</span></Link>
          <Link to="/printing-page"><span className="active">Printing</span></Link>
          <Link to="/my-orders"><span>My Orders</span></Link>
          <Link to="/cart"><span>🛒</span></Link>
          <span>👤</span>
        </div>
      </div>
      
      <div className="banner">
        <h1>Printing Services (₹2/page)</h1>
        <p>Upload PDF → Auto page count → Added to your Token</p>
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
              disabled={totalPrice === 0 || loading}
              style={{ width: "100%", padding: "10px", backgroundColor: (totalPrice === 0 || loading) ? "#ccc" : "#007bff", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
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