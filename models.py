from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('Student', 'Admin'), default='Student')

class Item(db.Model):
    __tablename__ = 'Items'
    item_id = db.Column(db.Integer, primary_key=True)
    item_name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    price_per_unit = db.Column(db.Numeric(10, 2), nullable=False)
    stock_qty = db.Column(db.Integer, default=0)

class Order(db.Model):
    __tablename__ = 'Orders'
    order_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    total_price = db.Column(db.Numeric(10, 2), default=0.00)
    status = db.Column(db.Enum('Pending', 'Processing', 'Done', 'Collected', 'Cancelled'), default='Pending')
    payment_status = db.Column(db.Enum('Unpaid', 'Paid', 'Refunded'), default='Unpaid')
    created_at = db.Column(db.DateTime, server_default=db.func.now())

class OrderDetail(db.Model):
    __tablename__ = 'Order_Details'
    detail_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('Items.item_id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

class PrintRequest(db.Model):
    __tablename__ = 'Print_Requests'
    print_id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('Orders.order_id'), nullable=False)
    page_count = db.Column(db.Integer)
    is_color = db.Column(db.Boolean, default=False)
    print_price = db.Column(db.Numeric(10, 2), default=0.00)

class PrintFile(db.Model):
    __tablename__ = 'Print_Files'
    file_id = db.Column(db.Integer, primary_key=True)
    print_id = db.Column(db.Integer, db.ForeignKey('Print_Requests.print_id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    