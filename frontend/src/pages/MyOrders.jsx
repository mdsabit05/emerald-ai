import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser, UserButton, SignInButton } from "@clerk/clerk-react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { getMyOrders, getMyOrderDetails } from "../lib/api";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#b97c0a", bg: "#fff8e6" },
  confirmed: { label: "Confirmed", color: "#1a6fbe", bg: "#e8f1fc" },
  shipped:   { label: "Shipped",   color: "#7b3fcf", bg: "#f3ecfd" },
  delivered: { label: "Delivered", color: "#1a7a45", bg: "#e8f5ee" },
  cancelled: { label: "Cancelled", color: "#c0392b", bg: "#fdecea" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function OrderCard({ order, token }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  async function toggleDetails() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (details) return;
    setLoading(true);
    try {
      const data = await getMyOrderDetails(token, order.id);
      setDetails(data);
    } catch {
      setDetails(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="order-card">
      {/* ORDER HEADER */}
      <div className="order-card-header" onClick={toggleDetails}>
        <div className="order-card-meta">
          <span className="order-id">Order #{order.id}</span>
          <span className="order-date">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric"
            })}
          </span>
        </div>
        <div className="order-card-right">
          <span className="order-total">₹{order.totalAmount}</span>
          <StatusBadge status={order.status} />
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* ORDER DETAIL */}
      {open && (
        <div className="order-card-detail">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><div className="spinner" /></div>
          ) : details ? (
            <>
              {/* ITEMS */}
              <div className="order-items-list">
                {details.items.map((item, i) => (
                  <div key={i} className="order-item-row">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="order-item-img" />
                    )}
                    <div className="order-item-info">
                      <span className="order-item-name">{item.productName}</span>
                      <span className="order-item-qty">Qty: {item.quantity}</span>
                    </div>
                    <span className="order-item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="order-detail-divider" />

              {/* TOTAL ROW */}
              <div className="order-detail-total-row">
                <span>Total</span>
                <span>₹{details.totalAmount}</span>
              </div>

              {/* ADDRESS */}
              {details.address && (
                <div className="order-delivery-address">
                  <span className="order-detail-label">Delivery Address</span>
                  <p>
                    {details.address.fullName && <>{details.address.fullName}<br /></>}
                    {details.address.address && <>{details.address.address}<br /></>}
                    {details.address.city && <>{details.address.city}{details.address.state ? `, ${details.address.state}` : ""}{details.address.pincode ? ` - ${details.address.pincode}` : ""}<br /></>}
                    {details.address.phone && <>Phone: {details.address.phone}</>}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="order-detail-loading">Could not load details.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyOrders() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const t = await getToken({ template: "default" });
        setToken(t);
        const data = await getMyOrders(t);
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (!isSignedIn && !loading) {
    return (
      <div className="profile-page-wrapper dashboard-view">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1.5rem", textAlign: "center" }}>
          <Package size={48} strokeWidth={1.2} style={{ color: "var(--text-light)", opacity: 0.4 }} />
          <h2 style={{ fontSize: "1.6rem", color: "var(--emerald)", fontFamily: "'Playfair Display', serif" }}>Please sign in</h2>
          <p style={{ color: "var(--text-light)", maxWidth: 360 }}>
            Please login to see your orders.
          </p>
          <SignInButton mode="modal">
            <button className="signin-btn" style={{ fontSize: "0.9rem", padding: "12px 32px" }}>Sign In</button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="page-spinner"><div className="spinner" /></div>;
  }

  if (error) {
    return <div style={{ padding: "4rem", textAlign: "center" }}><p>{error}</p></div>;
  }

  return (
    <div className="profile-page-wrapper dashboard-view">
      <div className="dashboard-layout">

        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">
          <div className="user-profile-summary">
            <div style={{ marginBottom: "1rem" }}>
              <UserButton />
            </div>
            <div className="user-greeting">
              <h3>Welcome back,</h3>
              <h2>{user?.firstName || "VIP"}.</h2>
              <span className="vip-badge">Emerald Green Member 💌</span>
            </div>
          </div>

          <nav className="dashboard-nav">
            <div className="nav-tabs-group">
              <button
                className={`nav-btn ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                My Orders
              </button>
              <button
                className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => setActiveTab("profile")}
              >
                Profile
              </button>
            </div>
          </nav>
        </aside>

        {/* MAIN */}
        <main className="dashboard-content">

          {activeTab === "orders" && (
            <div className="tracking-hub">
              <span className="section-label">Your Purchases</span>
              <h2 className="dashboard-title">My Orders</h2>

              {orders.length === 0 ? (
                <div className="empty-state-card">
                  <div className="empty-state-icon"><Package size={40} strokeWidth={1.5} /></div>
                  <h3>No orders yet</h3>
                  <p>Explore our premium collection to begin your wellness journey.</p>
                  <Link to="/collection" className="btn" style={{ marginTop: "1.5rem" }}>
                    Shop Collection
                  </Link>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} token={token} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="profile-settings-hub">
              <span className="section-label">Account</span>
              <h2 className="dashboard-title">Profile</h2>
              <div style={{ marginTop: "2rem" }}>
                <p><strong>Name:</strong> {user?.fullName}</p>
                <p style={{ marginTop: "0.75rem" }}>
                  <strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
