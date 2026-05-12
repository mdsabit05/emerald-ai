import { Hono } from "hono";
import { eq, and } from "drizzle-orm";
import { createDB } from "../db";
import { addresses } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const addressesRoute = new Hono();

// GET all addresses for current user
addressesRoute.get("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDB(c.env.DB);

  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.clerkUserId, user.sub));

  return c.json({ success: true, data: rows });
});

// CREATE address
addressesRoute.post("/", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDB(c.env.DB);
  const body = await c.req.json();

  const { name, phone, address, city, state, pincode } = body;
  if (!name || !phone || !address || !city || !state || !pincode) {
    return c.json({ success: false, message: "All fields are required" }, 400);
  }

  const result = await db
    .insert(addresses)
    .values({ clerkUserId: user.sub, name, phone, address, city, state, pincode })
    .returning();

  return c.json({ success: true, data: result[0] });
});

// UPDATE address
addressesRoute.put("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDB(c.env.DB);
  const id = Number(c.req.param("id"));
  const body = await c.req.json();

  const { name, phone, address, city, state, pincode } = body;

  const result = await db
    .update(addresses)
    .set({ name, phone, address, city, state, pincode })
    .where(and(eq(addresses.id, id), eq(addresses.clerkUserId, user.sub)))
    .returning();

  if (!result[0]) {
    return c.json({ success: false, message: "Address not found" }, 404);
  }

  return c.json({ success: true, data: result[0] });
});

// DELETE address
addressesRoute.delete("/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const db = createDB(c.env.DB);
  const id = Number(c.req.param("id"));

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.clerkUserId, user.sub)));

  return c.json({ success: true, message: "Address deleted" });
});

export default addressesRoute;
