import { Hono } from "hono";
import { eq, asc } from "drizzle-orm";
import { createDB } from "../db";
import { sliderSlides, products } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const sliderRoute = new Hono();

// GET all slides (public) — includes product image and name when linked
sliderRoute.get("/", async (c) => {
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

export default sliderRoute;
