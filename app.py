import pymysql
pymysql.install_as_MySQLdb()
from datetime import datetime, date, timedelta

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from pypdf import PdfReader
import os, uuid

app = Flask(__name__)
CORS(app)

# Your existing MySQL config
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:Srushti%402505@localhost/stationary_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)

# Simple Order model (like your example)
class PrintOrder(db.Model):
    __tablename__ = 'print_orders'
    id = db.Column(db.Integer, primary_key=True)
    order_token = db.Column(db.String(10), unique=True)
    filename = db.Column(db.String(255))
    pages = db.Column(db.Integer)
    copies = db.Column(db.Integer)
    total_price = db.Column(db.Float)
    status = db.Column(db.String(50), default='Pending')

# Create uploads folder
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def home():
    return "<h1>✅ Printing Backend Running!</h1>"

@app.route('/api/order', methods=['POST'])
def place_order():
    """EXACT logic from your example - pypdf + MySQL"""
    file = request.files['file']
    copies = int(request.form.get('copies', 1))
    
    # Generate token like your example
    token = str(uuid.uuid4().hex[:6]).upper()
    path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(path)
    
    # EXACT pypdf logic from your example
    pages = len(PdfReader(path).pages)
    price = (pages * 2.0) * copies  # ₹2 × pages × copies
    
    # Save to DB like your example
    new_order = PrintOrder(
        order_token=token, 
        filename=file.filename, 
        pages=pages, 
        copies=copies, 
        total_price=price
    )
    db.session.add(new_order)
    db.session.commit()
    
    return jsonify({
        "token": token, 
        "pages": pages, 
        "total": float(price), 
        "status": "Pending"
    })

@app.route('/api/admin/orders', methods=['GET'])
def get_orders():
    """Shopkeeper dashboard - like your example"""
    orders = PrintOrder.query.all()
    return jsonify([{
        "id": o.id, 
        "token": o.order_token, 
        "file": o.filename, 
        "pages": o.pages,
        "copies": o.copies,
        "price": float(o.total_price),
        "status": o.status
    } for o in orders])

@app.route('/api/download/<filename>')
def download_file(filename):
    """Shopkeeper download - like your example"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)


@app.route('/api/order/complete/<int:order_id>', methods=['POST'])
def complete_order(order_id):
    order = PrintOrder.query.get(order_id)
    if order:
        order.status = 'Done'
        db.session.commit()
        return jsonify({"message": "Success"}), 200
    return jsonify({"message": "Order not found"}), 404



@app.route('/api/admin/orders/clear-completed', methods=['DELETE'])
def clear_completed_orders():
    try:
        # Delete all rows where status is 'Done'
        num_rows_deleted = db.session.query(PrintOrder).filter(PrintOrder.status == 'Done').delete()
        db.session.commit()
        return jsonify({"message": f"Successfully cleared {num_rows_deleted} orders"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='127.0.0.1', port=5000)
