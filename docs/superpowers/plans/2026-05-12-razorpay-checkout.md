# Razorpay Checkout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current direct `createOrder` call with a full Razorpay payment popup flow, ending with an in-place order confirmation state on the checkout page.

**Architecture:** Two new backend endpoints (`/initiate` creates a Razorpay order server-side, `/verify` validates the HMAC signature and writes to DB). The frontend opens the Razorpay JS modal between those two calls. On success the checkout page renders an in-place confirmation — no redirect.

**Tech Stack:** Hono + Cloudflare Workers + D1/Drizzle (backend), React/Vite + Clerk (frontend), Razorpay Checkout.js (payment modal), Web Crypto API for HMAC-SHA256 (no external crypto library needed).

---

## File Map

| File | Action | What changes |
|---|---|---|
| `backend/drizzle/0004_orders_payment.sql` | Create | Migration adding 4 columns to orders |
| `backend/src/db/schema.ts` | Modify | Add 4 columns to `orders` table type |
| `backend/wrangler.toml` | Modify | Add `[vars]` section with `RAZORPAY_KEY_ID` |
| `backend/.dev.vars` | Modify | Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` |
| `backend/src/index.ts` | Modify | Add Razorpay keys to `Bindings` type |
| `backend/src/routes/orders.ts` | Modify | Replace `POST /` with `POST /initiate` and `POST /verify`; keep other routes |
| `frontend/index.html` | Modify | Add Razorpay script tag |
| `frontend/.env` | Create | Add `VITE_RAZORPAY_KEY_ID` |
| `frontend/src/components/CartContext.jsx` | Modify | Add `clearCart` function |
| `frontend/src/lib/api.js` | Modify | Add `initiateOrder` and `verifyOrder` functions |
| `frontend/src/pages/Checkout.jsx` | Modify | Replace `handlePayment`, add `orderSuccess` state + success UI, remove manual payment method UI |

---

## Pre-requisite: Get Razorpay Test Keys

Before starting:
1. Go to [https://dashboard.razorpay.com](https://dashboard.razorpay.com) → create account (free)
2. Settings → API Keys → Generate Test Key
3. Copy **Key ID** (starts with `rzp_test_`) and **Key Secret**
4. Keep them ready — you'll add them in Task 3

---

## Task 1: DB Migration — Add payment columns to orders

**Files:**
- Create: `backend/drizzle/0004_orders_payment.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- backend/drizzle/0004_orders_payment.sql
ALTER TABLE orders ADD COLUMN razorpay_order_id text;
ALTER TABLE orders ADD COLUMN razorpay_payment_id text;
ALTER TABLE orders ADD COLUMN address_snapshot text;
ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
```

- [ ] **Step 2: Run the migration on local D1**

```bash
cd backend
npx wrangler d1 execute emerald-green-db --local --file=./drizzle/0004_orders_payment.sql
```

Expected output:
```
🌀 Executing on local database emerald-green-db ...
🚣 4 commands executed successfully.
```

- [ ] **Step 3: Commit**

```bash
git add backend/drizzle/0004_orders_payment.sql
git commit -m "feat: add razorpay and address columns to orders table"
```

---

## Task 2: Update Drizzle Schema

**Files:**
- Modify: `backend/src/db/schema.ts`

- [ ] **Step 1: Add the 4 new columns to the `orders` table definition**

Replace the current `orders` table definition:
```ts
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),
  clerkUserId: text("clerk_user_id")
    .notNull(),
  totalAmount: integer("total_amount")
    .notNull(),
  status: text("status")
    .default("pending"),
  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`),
});
```

With:
```ts
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),
  clerkUserId: text("clerk_user_id").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  addressSnapshot: text("address_snapshot"),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").default("pending"),
  status: text("status").default("pending"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: update orders schema with razorpay and address fields"
```

---

## Task 3: Environment Variables

**Files:**
- Modify: `backend/wrangler.toml`
- Modify: `backend/.dev.vars`
- Create: `frontend/.env`

- [ ] **Step 1: Add `RAZORPAY_KEY_ID` to wrangler.toml** (it's public — safe to commit)

Add after the `[dev]` block in `backend/wrangler.toml`:
```toml
[vars]
RAZORPAY_KEY_ID = "rzp_test_YOUR_KEY_ID_HERE"
```

Replace `rzp_test_YOUR_KEY_ID_HERE` with your actual test Key ID.

- [ ] **Step 2: Add secrets to `backend/.dev.vars`** (never committed — already in .gitignore)

Append to `backend/.dev.vars`:
```
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
```

Replace both values with your actual Razorpay test credentials.

- [ ] **Step 3: Create `frontend/.env`**

```
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
```

Replace with your actual test Key ID. This file is safe to keep locally but don't commit secrets.

- [ ] **Step 4: Commit wrangler.toml only** (not .dev.vars, not .env)

```bash
git add backend/wrangler.toml
git commit -m "feat: add RAZORPAY_KEY_ID var to wrangler config"
```

---

## Task 4: Update Backend Bindings Type

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Add Razorpay keys to the `Bindings` type**

In `backend/src/index.ts`, replace:
```ts
type Bindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
};
```

With:
```ts
type Bindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/index.ts
git commit -m "feat: add Razorpay keys to Bindings type"
```

---

## Task 5: Rewrite Orders Route with Initiate + Verify

**Files:**
- Modify: `backend/src/routes/orders.ts`

This task replaces `POST /` (the old `createOrder`) with two new endpoints: `POST /initiate` and `POST /verify`. All other routes (`GET /my-orders`, `GET /admin/all`, `PUT /admin/:id/status`) remain unchanged.

- [ ] **Step 1: Replace the full contents of `backend/src/routes/orders.ts`**

```ts
import { Hono } from "hono";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";
import { desc, eq, sql } from "drizzle-orm";
import { createDB } from "../db";
import { orders, orderItems, products } from "../db/schema";

type Bindings = {
  DB: D1Database;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
};

const ordersRoute = new Hono<{ Bindings: Bindings }>();

// ─── HMAC-SHA256 helper ───────────────────────────────────────────────────────
async function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === signature;
}

// ─── POST /initiate ───────────────────────────────────────────────────────────
// Validates cart + creates a Razorpay order. No DB write.
ordersRoute.post("/initiate", authMiddleware, async (c) => {
  const body = await c.req.json();
  const { items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return c.json({ success: false, message: "No items provided" }, 400);
  }

  const db = createDB(c.env.DB);
  let totalPaise = 0;

  // Validate products + stock
  for (const item of items) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId));

    if (!product[0]) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    if (product[0].stock < item.quantity) {
      return c.json(
        { success: false, message: `${product[0].name} is out of stock` },
        400
      );
    }
    totalPaise += product[0].price * item.quantity * 100; // paise
  }

  // Create Razorpay order
  const credentials = btoa(`${c.env.RAZORPAY_KEY_ID}:${c.env.RAZORPAY_KEY_SECRET}`);
  const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount: totalPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    }),
  });

  if (!rzpRes.ok) {
    const err = await rzpRes.json() as { error?: { description?: string } };
    return c.json(
      { success: false, message: err.error?.description || "Razorpay error" },
      500
    );
  }

  const rzpOrder = await rzpRes.json() as { id: string; amount: number };

  return c.json({
    success: true,
    razorpay_order_id: rzpOrder.id,
    amount: rzpOrder.amount,
    key_id: c.env.RAZORPAY_KEY_ID,
  });
});

// ─── POST /verify ─────────────────────────────────────────────────────────────
// Verifies HMAC signature → writes order to DB → reduces stock.
ordersRoute.post("/verify", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    items,
    address,
  } = body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !items ||
    !address
  ) {
    return c.json({ success: false, message: "Missing required fields" }, 400);
  }

  // Verify signature
  const valid = await verifyRazorpaySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    c.env.RAZORPAY_KEY_SECRET
  );

  if (!valid) {
    return c.json({ success: false, message: "Invalid payment signature" }, 400);
  }

  const db = createDB(c.env.DB);
  let total = 0;

  // Re-validate stock (race condition protection)
  for (const item of items) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId));

    if (!product[0]) {
      return c.json({ success: false, message: "Product not found" }, 404);
    }
    if (product[0].stock < item.quantity) {
      return c.json(
        { success: false, message: `${product[0].name} ran out of stock` },
        400
      );
    }
    total += product[0].price * item.quantity;
  }

  // Create order in DB
  const result = await db
    .insert(orders)
    .values({
      clerkUserId: user.sub,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      addressSnapshot: JSON.stringify(address),
      totalAmount: total,
      paymentStatus: "paid",
    })
    .returning();

  const order = result[0];

  // Create order items + reduce stock
  for (const item of items) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId));

    await db.insert(orderItems).values({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      price: product[0].price,
    });

    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  return c.json({
    success: true,
    order_id: order.id,
    total_amount: order.totalAmount,
  });
});

// ─── GET /my-orders ───────────────────────────────────────────────────────────
ordersRoute.get("/my-orders", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDB(c.env.DB);

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.clerkUserId, user.sub))
    .orderBy(desc(orders.createdAt));

  return c.json({ success: true, data: userOrders });
});

// ─── GET /admin/all ───────────────────────────────────────────────────────────
ordersRoute.get("/admin/all", authMiddleware, adminMiddleware, async (c) => {
  const db = createDB(c.env.DB);
  const allOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt));
  return c.json({ success: true, data: allOrders });
});

// ─── PUT /admin/:id/status ────────────────────────────────────────────────────
ordersRoute.put("/admin/:id/status", authMiddleware, adminMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const db = createDB(c.env.DB);

  const existingOrder = await db.select().from(orders).where(eq(orders.id, id));
  if (!existingOrder[0]) {
    return c.json({ success: false, message: "Order not found" }, 404);
  }

  await db.update(orders).set({ status: body.status }).where(eq(orders.id, id));
  return c.json({ success: true, message: "Order status updated" });
});

export default ordersRoute;
```

- [ ] **Step 2: Restart the backend to pick up the new routes**

```bash
# Kill existing wrangler process (Ctrl+C it, or):
pkill -f wrangler
cd backend
npx wrangler dev --local
```

- [ ] **Step 3: Smoke test — verify `/initiate` route exists**

```bash
curl -X POST http://localhost:47832/api/orders/initiate \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":1,"quantity":1}]}'
```

Expected: `{"success":false,"message":"Unauthorized"}` (401 — auth required, which is correct)

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/orders.ts
git commit -m "feat: replace createOrder with razorpay initiate/verify endpoints"
```

---

## Task 6: Add `clearCart` to CartContext

**Files:**
- Modify: `frontend/src/components/CartContext.jsx`

- [ ] **Step 1: Add `clearCart` function**

In `CartContext.jsx`, find the `removeFromCart` function and add `clearCart` right after it:

```jsx
function clearCart() {
  setCartItems([]);
}
```

- [ ] **Step 2: Expose `clearCart` in the context value**

Find the `CartContext.Provider value={...}` and add `clearCart` to it. It currently looks something like:
```jsx
value={{
  cartItems,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  cartTotal,
  cartCount,
}}
```

Add `clearCart`:
```jsx
value={{
  cartItems,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
  cartTotal,
  cartCount,
}}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/CartContext.jsx
git commit -m "feat: add clearCart function to CartContext"
```

---

## Task 7: Add `initiateOrder` and `verifyOrder` to api.js

**Files:**
- Modify: `frontend/src/lib/api.js`

- [ ] **Step 1: Add the two new functions** at the top of the file, after the `API_URL` constant and before `getProducts`:

```js
export async function initiateOrder(token, { items, address }) {
  const res = await fetch(`${API_URL}/orders/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items, address }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to initiate order");
  return data;
}

export async function verifyOrder(token, { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address }) {
  const res = await fetch(`${API_URL}/orders/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Payment verification failed");
  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api.js
git commit -m "feat: add initiateOrder and verifyOrder api functions"
```

---

## Task 8: Add Razorpay Script to index.html

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Add the script tag** before the closing `</body>` tag:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/Main_logo.jpeg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>emerald-green-labs</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat: add Razorpay checkout script to index.html"
```

---

## Task 9: Rewrite Checkout.jsx — Payment Flow + Success State

**Files:**
- Modify: `frontend/src/pages/Checkout.jsx`

This task replaces the entire `Checkout.jsx` with the Razorpay-integrated version. The address selection UI, cart summary, and totals stay. The payment method radio buttons and UPI input are removed (Razorpay modal handles all payment methods). A new `orderSuccess` state drives the in-place success screen.

- [ ] **Step 1: Replace the full contents of `frontend/src/pages/Checkout.jsx`**

```jsx
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

    // Validate address
    const activeAddress =
      addressTab === "saved" ? selectedAddress : newAddress;

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

      // Step 1: Create Razorpay order
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
            alert("Payment verification failed. Contact support with your payment ID: " + response.razorpay_payment_id);
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
            {loading ? "Processing…" : `Pay ₹${finalTotal.toFixed(0)} & Place Order`}
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Checkout.jsx
git commit -m "feat: integrate Razorpay checkout with in-place success state"
```

---

## Task 10: Add Success State CSS

**Files:**
- Modify: `frontend/src/pages/checkout.css`

- [ ] **Step 1: Append success state styles** to the end of `frontend/src/pages/checkout.css`:

```css
/* ── ORDER SUCCESS STATE ─────────────────────────────────────────────────── */

.order-success-wrapper {
  max-width: 520px;
  margin: 60px auto;
  padding: 40px;
  background: white;
  border-radius: 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 40px rgba(19, 46, 36, 0.08);
}

.order-success-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #132e24;
  color: white;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-success-heading {
  font-size: 1.8rem;
  color: #132e24;
  margin: 0;
}

.order-success-id {
  font-size: 0.9rem;
  color: #888;
  margin: 0;
}

.order-success-total {
  font-size: 1.1rem;
  font-weight: 700;
  color: #132e24;
  margin: 0;
}

.order-success-address {
  width: 100%;
  background: #f8f7f2;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-success-address p {
  margin: 0;
  font-size: 0.88rem;
  color: #555;
}

.order-success-items {
  width: 100%;
  background: #f8f7f2;
  border-radius: 12px;
  padding: 14px 16px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-success-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.88rem;
  color: #333;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/checkout.css
git commit -m "feat: add order success state styles to checkout"
```

---

## Task 11: Manual End-to-End Test

- [ ] **Step 1: Make sure backend is running**

```bash
cd backend && npx wrangler dev --local
```

Expected: `Ready on http://0.0.0.0:47832`

- [ ] **Step 2: Make sure frontend is running**

```bash
cd frontend && npm run dev
```

Expected: `Local: http://localhost:34521/`

- [ ] **Step 3: Test the happy path**

1. Open `http://localhost:34521/collection` and add a product to cart
2. Go to `/checkout`
3. Select or enter a delivery address
4. Click "Pay & Place Order"
5. Razorpay modal opens — use Razorpay test card: `4111 1111 1111 1111`, expiry `12/26`, CVV `123`, any name
6. Complete payment
7. Checkout page should transform to success state showing order ID, total, address, items
8. Click "View My Orders" — order should appear there

- [ ] **Step 4: Test the dismiss case**

1. Click "Pay & Place Order"
2. Close the Razorpay modal (X button)
3. Verify the "Pay & Place Order" button is no longer in loading state (clickable again)

- [ ] **Step 5: Final commit (tag the feature complete)**

```bash
git add -A
git commit -m "feat: razorpay checkout flow complete"
```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - `POST /initiate` — Task 5 ✓
  - `POST /verify` with HMAC — Task 5 ✓
  - 4 DB columns + migration — Tasks 1 & 2 ✓
  - Razorpay script in index.html — Task 8 ✓
  - `clearCart` on success — Task 6 + used in Task 9 ✓
  - In-place success state with all required fields — Task 9 ✓
  - Success state CSS — Task 10 ✓
  - `ondismiss` resets loading — Task 9 ✓
  - Re-validate stock in `/verify` — Task 5 ✓
  - `address_snapshot` stored as JSON — Task 5 ✓

- [x] **Type consistency:** `initiateOrder` returns `{ razorpay_order_id, amount, key_id }` in Task 5, consumed with same names in Task 9. `verifyOrder` returns `{ order_id, total_amount }` in Task 5, read as `result.order_id` / `result.total_amount` in Task 9. ✓

- [x] **No placeholders:** All code is complete. ✓
