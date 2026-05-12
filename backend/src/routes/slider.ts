import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDB } from "../db";
import { sliderSlides } from "../db/schema";
import { authMiddleware } from "../middleware/auth";
import { adminMiddleware } from "../middleware/admin";

const sliderRoute = new Hono();

// GET all slides (public)
sliderRoute.get("/", async (c) => {
  const db = createDB(c.env.DB);
  const slides = await db
    .select()
    .from(sliderSlides)
    .orderBy(sliderSlides.position);
  return c.json({ success: true, data: slides });
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
