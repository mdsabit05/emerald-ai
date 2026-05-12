# Razorpay Checkout Flow — Design Spec
**Date:** 2026-05-12  
**Project:** Emerald Green Labs  
**Scope:** Razorpay payment integration with in-place order confirmation

---

## Overview

Replace the current direct `createOrder` call in the checkout page with a full Razorpay payment flow. After successful payment, the checkout page transforms in-place to show an order confirmation state. No email integration in this phase.

---

## User Flow

```
[Checkout Page]
  │
  ├─ User selects saved address OR fills new address
  ├─ User clicks "Place Order"
  │
  ▼
POST /api/orders/initiate
  └─ Validates stock, calls Razorpay API
  └─ Returns { razorpay_order_id, amount, key_id }
  │
  ▼
[Razorpay Modal opens in browser]
  └─ User pays via UPI / Card / Wallet
  │
  ▼
Razorpay handler callback
  └─ { razorpay_payment_id, razorpay_order_id, razorpay_signature }
  │
  ▼
POST /api/orders/verify
  └─ Verifies HMAC signature
  └─ Writes order + items to DB
  └─ Reduces product stock
  └─ Returns { order_id, total_amount }
  │
  ▼
[Checkout page → Success state]
  └─ Order number, items, address, "View My Orders" button
  └─ Cart is cleared
```

---

## Database Schema Changes

Migration file: `backend/drizzle/0004_orders_payment.sql`

Four columns added to the existing `orders` table:

| Column | Type | Default | Purpose |
|---|---|---|---|
| `razorpay_order_id` | text | null | Razorpay order ID (`order_xxx`) |
| `razorpay_payment_id` | text | null | Razorpay payment ID (`pay_xxx`) |
| `address_snapshot` | text | null | JSON string of address at time of order |
| `payment_status` | text | `"pending"` | `"pending"` or `"paid"` |

`address_snapshot` format:
```json
{ "name": "Rahul", "phone": "9876543210", "address": "12 MG Road", "city": "Bangalore", "state": "Karnataka", "pincode": "560001" }
```

`payment_status` (money received) is intentionally separate from `status` (fulfillment: pending/shipped/delivered).

---

## Backend

### New Environment Variables

| Variable | Where | Notes |
|---|---|---|
| `RAZORPAY_KEY_ID` | `.dev.vars` + wrangler.toml `[vars]` | Public — also returned to frontend |
| `RAZORPAY_KEY_SECRET` | `.dev.vars` only | Private — never sent to client |

### Bindings type update

Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to the `Bindings` type in `backend/src/index.ts`.

### `POST /api/orders/initiate`

**Auth:** Required (Clerk JWT)

**Request body:**
```json
{
  "items": [{ "productId": 1, "quantity": 2 }],
  "address": { "name": "...", "phone": "...", "address": "...", "city": "...", "state": "...", "pincode": "..." }
}
```

**Logic:**
1. Validate all products exist and have sufficient stock
2. Calculate total in paise (`price × quantity × 100`)
3. Call `POST https://api.razorpay.com/v1/orders` with Basic Auth (`key_id:key_secret`)
   - Body: `{ amount, currency: "INR", receipt: "rcpt_<timestamp>" }`
4. Return `{ razorpay_order_id, amount, key_id }`

**No DB write at this stage.**

### `POST /api/orders/verify`

**Auth:** Required (Clerk JWT)

**Request body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "abc123...",
  "items": [{ "productId": 1, "quantity": 2 }],
  "address": { "name": "...", ... }
}
```

**Logic:**
1. HMAC-SHA256 verify: `razorpay_order_id + "|" + razorpay_payment_id` signed with `KEY_SECRET` must equal `razorpay_signature`. Return 400 if mismatch.
2. Re-validate stock (race condition protection — between initiate and verify, stock could have been bought by someone else)
3. `INSERT` into `orders` with `razorpay_order_id`, `razorpay_payment_id`, `address_snapshot` (JSON), `payment_status = "paid"`
4. `INSERT` into `order_items` for each item
5. `UPDATE products SET stock = stock - quantity` for each item
6. Return `{ order_id, total_amount }`

**HMAC verification** uses Web Crypto API (available in Cloudflare Workers):
```ts
const encoder = new TextEncoder();
const key = await crypto.subtle.importKey(
  "raw", encoder.encode(secret),
  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
);
const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${orderId}|${paymentId}`));
const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
// hex === razorpay_signature
```

### Existing `POST /api/orders` route

Remove or deprecate — replaced by the two-step initiate/verify flow.

---

## Frontend

### Environment Variable

Add to `frontend/.env`:
```
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

### Script tag

Add to `frontend/index.html` (before closing `</body>`):
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### `frontend/src/lib/api.js`

Two new functions:
- `initiateOrder(token, { items, address })` — calls `POST /api/orders/initiate`
- `verifyOrder(token, { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address })` — calls `POST /api/orders/verify`

### `frontend/src/pages/Checkout.jsx`

**New state:**
- `orderSuccess` — null or `{ orderId, total, address, items }` — when set, renders success state instead of form

**`handlePlaceOrder()` new logic:**
1. Validate address + phone (10 digits)
2. `setLoading(true)`
3. Call `initiateOrder(token, { items, address })` → get `{ razorpay_order_id, amount, key_id }`
4. Instantiate and open Razorpay:
   ```js
   const rzp = new window.Razorpay({
     key: key_id,
     order_id: razorpay_order_id,
     amount,
     currency: "INR",
     name: "Emerald Green Labs",
     prefill: { name: address.name, contact: address.phone },
     theme: { color: "#132e24" },
     handler: async (response) => {
       const result = await verifyOrder(token, { ...response, items, address });
       clearCart();
       setOrderSuccess({ orderId: result.order_id, total: result.total_amount, address, items });
     },
     modal: { ondismiss: () => setLoading(false) }
   });
   rzp.open();
   ```

**Success state UI** (rendered when `orderSuccess !== null`):
- Green checkmark icon
- "Order Placed!" heading
- Order ID (e.g. `#1042`)
- Total amount
- Delivery address summary
- Items ordered (name + qty)
- "View My Orders" button → `/my-orders`

---

## What Is NOT in Scope

- Order confirmation email (deferred to future phase)
- Razorpay webhooks (not needed for basic integration — signature verification is sufficient)
- Refund flow
- Failed payment retry UI (Razorpay modal handles retries internally)

---

## Setup Steps for Developer

1. Create Razorpay account at razorpay.com → Dashboard → Settings → API Keys → Generate Test Key
2. Copy `Key ID` and `Key Secret`
3. Add to `backend/.dev.vars`: `RAZORPAY_KEY_ID=rzp_test_...` and `RAZORPAY_KEY_SECRET=...`
4. Add to `frontend/.env`: `VITE_RAZORPAY_KEY_ID=rzp_test_...`
