import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";
import "./PrintingPage.css"

function PrintingPage() {
  const [file, setFile] = useState(null);
  const [copies, setCopies] = useState(1);
  const [printType, setPrintType] = useState("bw"); // 'bw' or 'color'
  const [pageCount, setPageCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Pricing constants
  const BW_PRICE = 2;
  const COLOR_PRICE = 10;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setPageCount(0);
      setTotalPrice(0);
    }
  };

  // Recalculate price locally when copies or print type changes after analysis
  useEffect(() => {
    if (pageCount > 0) {
      const rate = printType === "color" ? COLOR_PRICE : BW_PRICE;
      setTotalPrice(pageCount * rate * copies);
    }
  }, [copies, printType, pageCount]);

  const analyzePDF = async () => {
    if (!file) return;
    setLoading(true);
    
    const user = JSON.parse(localStorage.getItem("user"));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('copies', copies);
    formData.append('print_type', printType); // Send selection to backend
    formData.append('moodle_id', user.moodle_id); 
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/order', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setPageCount(data.pages);
        // Note: Backend should also handle the print_type logic for the final total
        setTotalPrice(data.total); 
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      // Fallback logic
      const estimated = Math.max(1, Math.round(file.size / 1024 / 400));
      setPageCount(estimated);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = () => {
    if (!file || totalPrice === 0) return;
    alert(`Order confirmed! ${printType.toUpperCase()} print added to your token.`);
    navigate("/my-orders");
  };

  return (
    <div className="dashboard-container">
      <div className="banner">
        <h1>Printing Services</h1>
        <p>B&W: ₹{BW_PRICE}/page | Color: ₹{COLOR_PRICE}/page</p>
      </div>
      
      <div className="printing-card" style={{ maxWidth: "600px", margin: "2rem auto", padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        
        {/* Upload Area */}
        <div className="upload-section" style={{ border: "2px dashed #3b82f6", padding: "2rem", textAlign: "center", borderRadius: "8px", marginBottom: "1.5rem", backgroundColor: "#eff6ff" }}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} id="fileInput" style={{ display: "none" }} />
          <label htmlFor="fileInput" style={{ cursor: "pointer", color: "#3b82f6", fontWeight: "bold" }}>
            {file ? `📄 ${file.name}` : "Click to upload PDF"}
          </label>
        </div>

        {file && (
          <div className="controls">
            {/* Print Type Selection */}
            <div style={{ marginBottom: "1.5rem", display: "flex", gap: "20px", justifyContent: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="printType" 
                  value="bw" 
                  checked={printType === "bw"} 
                  onChange={(e) => setPrintType(e.target.value)} 
                />
                Black & White
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="printType" 
                  value="color" 
                  checked={printType === "color"} 
                  onChange={(e) => setPrintType(e.target.value)} 
                />
                Color Print
              </label>
            </div>

            <div style={{ marginBottom: "1rem", textAlign: "center" }}>
              <label>Copies: </label>
              <input 
                type="number" 
                value={copies} 
                onChange={(e) => setCopies(Math.max(1, e.target.value))} 
                style={{ width: "60px", padding: "8px", borderRadius: "6px", border: "1px solid #ddd" }}
              />
            </div>

            <button onClick={analyzePDF} disabled={loading} className="btn-ready" style={{ width: "100%", marginBottom: "1rem" }}>
              {loading ? "Analyzing..." : "Analyze & Calculate Price"}
            </button>

            {totalPrice > 0 && (
              <div className="price-summary" style={{ padding: "15px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "1rem", textAlign: "center" }}>
                <p style={{ margin: "5px 0" }}><strong>Format:</strong> {printType === 'bw' ? 'B&W' : 'Color'}</p>
                <p style={{ margin: "5px 0" }}><strong>Pages:</strong> {pageCount}</p>
                <h2 style={{ color: "#1e293b", margin: "10px 0" }}>Total: ₹{totalPrice}</h2>
              </div>
            )}

            <button 
              onClick={placeOrder}
              disabled={totalPrice === 0 || loading}
              className="btn-collect"
              style={{ width: "100%", opacity: (totalPrice === 0 || loading) ? 0.5 : 1 }}
            >
              Confirm Print Order
            </button>
          </div>
        )}

        {previewUrl && (
          <div style={{ marginTop: "2rem" }}>
            <h4 style={{ marginBottom: "10px" }}>Document Preview</h4>
            <iframe src={previewUrl} width="100%" height="350px" style={{ border: "1px solid #eee", borderRadius: "8px" }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default PrintingPage;