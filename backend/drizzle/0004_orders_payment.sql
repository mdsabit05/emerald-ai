ALTER TABLE orders ADD COLUMN razorpay_order_id text;
ALTER TABLE orders ADD COLUMN razorpay_payment_id text;
ALTER TABLE orders ADD COLUMN address_snapshot text;
ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
