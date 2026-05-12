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
    totalPaise += product[0].price * item.quantity * 100; // convert to paise
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
