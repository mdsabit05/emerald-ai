import { Hono } from "hono";
import { adminMiddleware } from "../middleware/admin";
import { authMiddleware } from "../middleware/auth";
import { desc, eq, sql } from "drizzle-orm";
import { createDB } from "../db";
import { orders, orderItems, products, wishlists } from "../db/schema";

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

// ─── GET /my-orders/:id/details ──────────────────────────────────────────────
ordersRoute.get("/my-orders/:id/details", authMiddleware, async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const db = createDB(c.env.DB);

  const order = await db.select().from(orders).where(eq(orders.id, id));
  if (!order[0]) return c.json({ success: false, message: "Order not found" }, 404);
  if (order[0].clerkUserId !== user.sub) return c.json({ success: false, message: "Forbidden" }, 403);

  const items = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productName: products.name,
      productImage: products.imageUrl,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  let address = null;
  try { address = order[0].addressSnapshot ? JSON.parse(order[0].addressSnapshot) : null; } catch {}

  return c.json({ success: true, data: { ...order[0], address, items } });
});

// ─── GET /admin/analytics ─────────────────────────────────────────────────────
ordersRoute.get("/admin/analytics", authMiddleware, adminMiddleware, async (c) => {
  const db = createDB(c.env.DB);

  const allOrders = await db.select().from(orders);

  // ── Totals ──────────────────────────────────────────────────────────────────
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = allOrders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // ── By status ───────────────────────────────────────────────────────────────
  const byStatus: Record<string, number> = {};
  for (const o of allOrders) {
    const s = o.status ?? "pending";
    byStatus[s] = (byStatus[s] || 0) + 1;
  }

  // ── This month vs last month ────────────────────────────────────────────────
  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

  let thisMonthRevenue = 0, thisMonthOrders = 0;
  let lastMonthRevenue = 0, lastMonthOrders = 0;

  for (const o of allOrders) {
    const month = (o.createdAt ?? "").substring(0, 7);
    if (month === thisMonthStr) { thisMonthRevenue += o.totalAmount; thisMonthOrders++; }
    if (month === lastMonthStr) { lastMonthRevenue += o.totalAmount; lastMonthOrders++; }
  }

  const revenuePct = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null;
  const ordersPct = lastMonthOrders > 0 ? Math.round(((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100) : null;

  // ── Revenue by day (last 30 days) ────────────────────────────────────────────
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 29);
  const cutoffStr = cutoff.toISOString().substring(0, 10);

  const revenueByDay: Record<string, number> = {};
  // Pre-fill all 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(cutoff);
    d.setDate(d.getDate() + i);
    revenueByDay[d.toISOString().substring(0, 10)] = 0;
  }
  for (const o of allOrders) {
    const day = (o.createdAt ?? "").substring(0, 10);
    if (day >= cutoffStr && revenueByDay[day] !== undefined) {
      revenueByDay[day] += o.totalAmount;
    }
  }
  const revenueChart = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));

  // ── Order items ──────────────────────────────────────────────────────────────
  const itemRows = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productName: products.name,
      productImage: products.imageUrl,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id));

  // ── Top products by revenue ──────────────────────────────────────────────────
  const productMap: Record<number, { name: string; image: string; revenue: number; units: number }> = {};
  for (const row of itemRows) {
    if (!row.productId) continue;
    if (!productMap[row.productId]) {
      productMap[row.productId] = { name: row.productName ?? "", image: row.productImage ?? "", revenue: 0, units: 0 };
    }
    productMap[row.productId].revenue += row.price * row.quantity;
    productMap[row.productId].units += row.quantity;
  }
  const topProducts = Object.entries(productMap)
    .map(([id, data]) => ({ productId: Number(id), ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // ── Unique + repeat customers ────────────────────────────────────────────────
  const customerOrderCounts: Record<string, number> = {};
  for (const o of allOrders) {
    customerOrderCounts[o.clerkUserId] = (customerOrderCounts[o.clerkUserId] || 0) + 1;
  }
  const uniqueCustomers = Object.keys(customerOrderCounts).length;
  const repeatCustomers = Object.values(customerOrderCounts).filter((n) => n > 1).length;

  // ── Low stock products (< 5) ─────────────────────────────────────────────────
  const allProducts = await db.select().from(products);
  const lowStock = allProducts
    .filter((p) => (p.stock ?? 0) < 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock ?? 0, image: p.imageUrl }))
    .sort((a, b) => a.stock - b.stock);

  // ── Most wishlisted ──────────────────────────────────────────────────────────
  const wishlistRows = await db
    .select({
      productId: wishlists.productId,
      productName: products.name,
      productImage: products.imageUrl,
    })
    .from(wishlists)
    .leftJoin(products, eq(wishlists.productId, products.id));

  const wishlistMap: Record<number, { name: string; image: string; count: number }> = {};
  for (const row of wishlistRows) {
    if (!row.productId) continue;
    if (!wishlistMap[row.productId]) {
      wishlistMap[row.productId] = { name: row.productName ?? "", image: row.productImage ?? "", count: 0 };
    }
    wishlistMap[row.productId].count++;
  }
  const mostWishlisted = Object.entries(wishlistMap)
    .map(([id, data]) => ({ productId: Number(id), ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return c.json({
    success: true,
    data: {
      totalRevenue, totalOrders, avgOrderValue, byStatus,
      thisMonth: { revenue: thisMonthRevenue, orders: thisMonthOrders },
      lastMonth: { revenue: lastMonthRevenue, orders: lastMonthOrders },
      revenuePct, ordersPct,
      revenueChart,
      topProducts,
      uniqueCustomers, repeatCustomers,
      lowStock,
      mostWishlisted,
    },
  });
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

// ─── GET /admin/:id/details ──────────────────────────────────────────────────
ordersRoute.get("/admin/:id/details", authMiddleware, adminMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const db = createDB(c.env.DB);

  const order = await db.select().from(orders).where(eq(orders.id, id));
  if (!order[0]) return c.json({ success: false, message: "Order not found" }, 404);

  const items = await db
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productName: products.name,
      productImage: products.imageUrl,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  let address = null;
  try { address = order[0].addressSnapshot ? JSON.parse(order[0].addressSnapshot) : null; } catch {}

  return c.json({ success: true, data: { ...order[0], address, items } });
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
