import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { createDB } from "../db";
import { sliderSlides, products } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const sliderRoute = new Hono();

// Auto-create table if it doesn't exist (handles missing migrations in production)
async function ensureTable(env: any) {
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS slider_slides (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, position INTEGER NOT NULL, label TEXT NOT NULL, image_url TEXT DEFAULT '', product_id INTEGER)"
    ).run();
  } catch (_) {}
}

// GET all slides (public) — includes product image and name when linked
sliderRoute.get("/", async (c) => {
  await ensureTable(c.env);
  const db = createDB(c.env.DB);
  const rows = await db
    .select({
      id: sliderSlides.id,
      position: sliderSlides.position,
      label: sliderSlides.label,
      imageUrl: sliderSlides.imageUrl,
      productId: sliderSlides.productId,
      productImageUrl: products.imageUrl,
      productName: products.name,
    })
    .from(sliderSlides)
    .leftJoin(products, eq(sliderSlides.productId, products.id))
    .orderBy(asc(sliderSlides.position));

  // Resolve display image: custom upload first, then product image
  const data = rows.map((row) => ({
    ...row,
    displayImage: row.imageUrl || row.productImageUrl || "",
  }));

  return c.json({ success: true, data });
});

// PUT update a slide (admin only)
sliderRoute.put("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const db = createDB(c.env.DB);

  const result = await db
    .update(sliderSlides)
    .set({
      label: body.label,
      imageUrl: body.imageUrl,
      productId: body.productId ?? null,
    })
    .where(eq(sliderSlides.id, id))
    .returning();

  return c.json({ success: true, data: result[0] });
});

// POST create a slide (admin only)
sliderRoute.post("/", authMiddleware, adminMiddleware, async (c) => {
  await ensureTable(c.env);
  const body = await c.req.json();
  const db = createDB(c.env.DB);

  const existing = await db.select({ position: sliderSlides.position }).from(sliderSlides).orderBy(asc(sliderSlides.position));
  const nextPosition = existing.length > 0 ? existing[existing.length - 1].position + 1 : 1;

  const result = await db
    .insert(sliderSlides)
    .values({
      position: nextPosition,
      label: body.label || "New Slide",
      imageUrl: body.imageUrl || "",
      productId: body.productId ?? null,
    })
    .returning();

  return c.json({ success: true, data: result[0] });
});

// DELETE a slide (admin only)
sliderRoute.delete("/:id", authMiddleware, adminMiddleware, async (c) => {
  const id = Number(c.req.param("id"));
  const db = createDB(c.env.DB);

  await db.delete(sliderSlides).where(eq(sliderSlides.id, id));
  return c.json({ success: true });
});

export default sliderRoute;
