import pymysql
pymysql.install_as_MySQLdb()
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from pypdf import PdfReader
import os

app = Flask(__name__)
CORS(app)

# --- Configuration ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:test1234@127.0.0.1:3306/stationary_system'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
db = SQLAlchemy(app)

# --- Models ---
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    moodle_id = db.Column(db.String(8), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Student', 'Admin'), default='Student')

class Order(db.Model):
    __tablename__ = 'Orders'
    order_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    order_token = db.Column(db.String(20), nullable=False) 
    total_price = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum('Pending', 'Processing', 'Done', 'Collected'), default='Pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    print_requests = db.relationship('PrintRequest', backref='order', lazy=True, cascade="all, delete-orphan")
    stationery_items = db.relationship('OrderDetail', backref='order', lazy=True, cascade="all, delete-orphan")

class PrintRequest(db.Model):
    __tablename__ = 'Print_Requests'
    print_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    pages = db.Column(db.Integer, nullable=False)
    copies = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)

class OrderDetail(db.Model):
    __tablename__ = 'Order_Details'
    detail_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    item_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    price = db.Column(db.Float, nullable=False)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# --- Routes ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(moodle_id=data.get('moodle_id')).first()
    if user and check_password_hash(user.password, data.get('password')):
        return jsonify({"user": {"name": user.name, "moodle_id": user.moodle_id, "role": user.role}}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/order', methods=['POST'])
def place_order():
    try:
        moodle_id = request.form.get('moodle_id')
        user = User.query.filter_by(moodle_id=moodle_id).first()
        active_order = Order.query.filter(Order.user_id == user.user_id, Order.status != 'Collected').first()

        if not active_order:
            active_order = Order(user_id=user.user_id, order_token=moodle_id)
            db.session.add(active_order)
            db.session.flush()

        # Handle Print Files
        if 'file' in request.files:
            file = request.files['file']
            copies = int(request.form.get('copies', 1))
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            pages = len(PdfReader(path).pages)
            price = (pages * 2.0) * copies
            db.session.add(PrintRequest(order_id=active_order.order_id, filename=file.filename, pages=pages, copies=copies, price=price))
            active_order.total_price += price

        # Handle Stationery Items
        item_name = request.form.get('item_name')
        if item_name:
            price = float(request.form.get('item_price', 0))
            qty = int(request.form.get('item_qty', 1))
            db.session.add(OrderDetail(order_id=active_order.order_id, item_name=item_name, quantity=qty, price=price*qty))
            active_order.total_price += (price * qty)

        db.session.commit()
        return jsonify({"token": active_order.order_token, "total": active_order.total_price}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/orders/<moodle_id>', methods=['GET'])
def get_user_orders(moodle_id):
    user = User.query.filter_by(moodle_id=moodle_id).first()
    if not user: return jsonify([]), 200
    orders = Order.query.filter(Order.user_id == user.user_id, Order.status != 'Collected').all()
    return jsonify([{
        "id": o.order_id, "token": o.order_token, "status": o.status, "total_price": o.total_price,
        "prints": [{"file": p.filename, "qty": p.copies} for p in o.print_requests],
        "items": [{"name": i.item_name, "qty": i.quantity} for i in o.stationery_items]
    } for o in orders]), 200

@app.route('/api/admin/orders', methods=['GET'])
def admin_orders():
    orders = Order.query.filter(Order.status != 'Collected').order_by(Order.created_at.desc()).all()
    return jsonify([{
        "id": o.order_id,
        "moodle_id": User.query.get(o.user_id).moodle_id,
        "status": o.status,
        "total": o.total_price,
        "items": [{"name": i.item_name, "qty": i.quantity} for i in o.stationery_items],
        "prints": [{"file": p.filename, "copies": p.copies} for p in o.print_requests]
    } for o in orders]), 200

@app.route('/api/admin/update-status', methods=['POST'])
def update_status():
    data = request.json
    order = Order.query.get(data.get('order_id'))
    if order:
        order.status = data.get('status')
        db.session.commit()
        return jsonify({"message": "Status updated"}), 200
    return jsonify({"error": "Order not found"}), 404

@app.route('/api/download/<filename>')
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/admin/orders/clear-completed', methods=['DELETE'])
def clear_completed():
    try:
        # Cascade delete is handled by relationship definitions
        Order.query.filter(Order.status.in_(['Done', 'Collected'])).delete(synchronize_session=False)
        db.session.commit()
        return jsonify({"message": "History cleared"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)