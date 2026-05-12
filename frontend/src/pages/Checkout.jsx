import { useState } from "react";
import { useCart } from "../components/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { initiateOrder, verifyOrder } from "../lib/api";
import { useAddress } from "../components/AddressContext";
import "./checkout.css";

export default function Checkout() {
  const {
    cartItems,
    cartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { addresses, addAddress } = useAddress();

  const [addressTab, setAddressTab] = useState(
    addresses.length > 0 ? "saved" : "new"
  );
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [saveAddress, setSaveAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  // SHIPPING
  const qualifiesForFreeShipping = cartTotal >= 1000;
  const shippingCost = qualifiesForFreeShipping ? 0 : 150;
  const finalTotal = cartTotal + shippingCost;

  // DELIVERY DATE
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDate = deliveryDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // EMPTY CART
  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="checkout-empty-state">
        <h2>Your Bag is Empty</h2>
        <p>Explore our premium collection to begin.</p>
        <Link to="/collection" className="btn">Return to Collection</Link>
      </div>
    );
  }

  // SUCCESS STATE
  if (orderSuccess) {
    return (
      <div className="checkout-page-wrapper">
        <div className="order-success-wrapper">
          <div className="order-success-icon">✓</div>
          <h2 className="order-success-heading">Order Placed!</h2>
          <p className="order-success-id">Order #{orderSuccess.orderId}</p>
          <p className="order-success-total">
            Total paid: ₹{orderSuccess.total.toFixed(0)}
          </p>

          <div className="order-success-address">
            <span className="section-label">Delivering to</span>
            <p>{orderSuccess.address.name} · {orderSuccess.address.phone}</p>
            <p>{orderSuccess.address.address}</p>
            <p>
              {orderSuccess.address.city}, {orderSuccess.address.state} —{" "}
              {orderSuccess.address.pincode}
            </p>
          </div>

          <div className="order-success-items">
            <span className="section-label">Items</span>
            {orderSuccess.items.map((item) => (
              <div key={item.id} className="order-success-item">
                <span>{item.name || item.title}</span>
                <span>× {item.quantity}</span>
              </div>
            ))}
          </div>

          <button
            className="btn btn-place-order"
            onClick={() => navigate("/my-orders")}
          >
            View My Orders
          </button>
        </div>
      </div>
    );
  }

  // PAYMENT HANDLER
  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const activeAddress = addressTab === "saved" ? selectedAddress : newAddress;

    if (addressTab === "saved" && !selectedAddress) {
      alert("Please select a saved address");
      return;
    }

    if (addressTab === "new") {
      const { name, phone, address, city, state, pincode } = newAddress;
      if (!name || !phone || !address || !city || !state || !pincode) {
        alert("Please fill in all address fields");
        return;
      }
      if (phone.length !== 10) {
        alert("Phone number must be 10 digits");
        return;
      }
    }

    setLoading(true);

    try {
      const token = await getToken();
      const items = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      // Save new address if checkbox checked
      if (addressTab === "new" && saveAddress) {
        await addAddress(newAddress);
      }

      // Step 1: Create Razorpay order on backend
      const { razorpay_order_id, amount, key_id } = await initiateOrder(
        token,
        { items, address: activeAddress }
      );

      // Step 2: Open Razorpay modal
      const rzp = new window.Razorpay({
        key: key_id,
        order_id: razorpay_order_id,
        amount,
        currency: "INR",
        name: "Emerald Green Labs",
        description: "Premium Wellness Products",
        prefill: {
          name: activeAddress.name,
          contact: activeAddress.phone,
        },
        theme: { color: "#132e24" },
        handler: async (response) => {
          try {
            const result = await verifyOrder(token, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              items,
              address: activeAddress,
            });
            clearCart();
            setOrderSuccess({
              orderId: result.order_id,
              total: result.total_amount,
              address: activeAddress,
              items: cartItems,
            });
          } catch (err) {
            alert(
              "Payment verification failed. Contact support with your payment ID: " +
                response.razorpay_payment_id
            );
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-header-simple">
        <h2>Secure Checkout</h2>
      </div>

      <div className="checkout-grid">
        {/* LEFT — FORM */}
        <form className="checkout-form-section" onSubmit={handlePlaceOrder}>

          {/* CONTACT */}
          <div className="checkout-block">
            <span className="section-label">Contact Information</span>
            <input
              type="email"
              className="luxury-input"
              placeholder="Email Address"
              required
            />
            <div className="checkbox-group">
              <input type="checkbox" id="newsletter" defaultChecked />
              <label htmlFor="newsletter">
                Keep me updated on exclusive releases.
              </label>
            </div>
          </div>

          {/* ADDRESSES */}
          <div className="checkout-addresses">
            <span className="section-label">Delivery Address</span>

            <div className="address-tabs">
              <button
                type="button"
                className={`address-tab ${addressTab === "saved" ? "active" : ""}`}
                onClick={() => setAddressTab("saved")}
              >
                Saved Addresses
              </button>
              <button
                type="button"
                className={`address-tab ${addressTab === "new" ? "active" : ""}`}
                onClick={() => setAddressTab("new")}
              >
                + New Address
              </button>
            </div>

            {addressTab === "saved" &&
              (addresses.length === 0 ? (
                <p className="no-addresses">
                  No saved addresses yet.{" "}
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setAddressTab("new")}
                  >
                    Add one now
                  </button>
                </p>
              ) : (
                <div className="checkout-address-grid">
                  {addresses.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`checkout-address-card ${
                        selectedAddress?.id === item.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedAddress(item)}
                    >
                      <h4>{item.name}</h4>
                      <p>{item.phone}</p>
                      <p>{item.address}</p>
                      <p>
                        {item.city}, {item.state} — {item.pincode}
                      </p>
                    </button>
                  ))}
                </div>
              ))}

            {addressTab === "new" && (
              <div className="new-address-form">
                <div className="address-row">
                  <input
                    className="luxury-input"
                    placeholder="Full Name"
                    value={newAddress.name}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, name: e.target.value })
                    }
                  />
                  <div className="phone-field">
                    <input
                      className="luxury-input"
                      type="tel"
                      placeholder="+91 Phone Number"
                      value={newAddress.phone}
                      maxLength={10}
                      onChange={(e) =>
                        setNewAddress({
                          ...newAddress,
                          phone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                    />
                    {newAddress.phone.length > 0 &&
                      newAddress.phone.length !== 10 && (
                        <span className="phone-warning">
                          Phone number must be 10 digits
                        </span>
                      )}
                  </div>
                </div>
                <input
                  className="luxury-input"
                  placeholder="Street Address"
                  value={newAddress.address}
                  onChange={(e) =>
                    setNewAddress({ ...newAddress, address: e.target.value })
                  }
                />
                <div className="address-row">
                  <input
                    className="luxury-input"
                    placeholder="City"
                    value={newAddress.city}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, city: e.target.value })
                    }
                  />
                  <input
                    className="luxury-input"
                    placeholder="State"
                    value={newAddress.state}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, state: e.target.value })
                    }
                  />
                  <input
                    className="luxury-input"
                    placeholder="Pincode"
                    value={newAddress.pincode}
                    onChange={(e) =>
                      setNewAddress({ ...newAddress, pincode: e.target.value })
                    }
                  />
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="saveAddr"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                  />
                  <label htmlFor="saveAddr">
                    Save this address for future orders
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* PLACE ORDER */}
          <button
            type="submit"
            className="btn btn-place-order"
            disabled={loading}
          >
            {loading
              ? "Processing…"
              : `Pay ₹${finalTotal.toFixed(0)} & Place Order`}
          </button>

          <p className="secure-badge">
            🔒 Secured by Razorpay · 256-bit Encryption
          </p>
        </form>

        {/* RIGHT — SUMMARY */}
        <div className="checkout-summary-section">
          <div className="summary-box">
            <span className="section-label">Order Summary</span>

            {cartItems.map((item) => (
              <div className="summary-item" key={item.id}>
                <img
                  src={
                    item.imageUrl ||
                    item.image ||
                    item.images?.[0] ||
                    "/placeholder.png"
                  }
                  alt={item.name || item.title}
                  className="summary-product-image"
                />
                <div className="summary-product-content">
                  <div className="summary-product-top">
                    <div>
                      <h4>{item.name || item.title}</h4>
                      <p>Premium Wellness Product</p>
                    </div>
                    <span className="summary-price">
                      ₹{(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                  <div className="summary-bottom-row">
                    <div className="qty-box">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="remove-cart-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="summary-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{cartTotal.toFixed(0)}</span>
              </div>
              <div className="total-row">
                <span>Shipping</span>
                {qualifiesForFreeShipping ? (
                  <span className="vip-shipping">Complimentary VIP</span>
                ) : (
                  <span>₹{shippingCost.toFixed(0)}</span>
                )}
              </div>
            </div>

            <div className="total-row grand-total">
              <span>Total</span>
              <span>₹{finalTotal.toFixed(0)}</span>
            </div>

            <div className="delivery-estimate">
              <span className="section-label">Guaranteed Arrival</span>
              <p>
                Arrives by <strong>{formattedDate}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
