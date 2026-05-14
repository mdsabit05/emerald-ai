import { Hono } from "hono";

import { eq, desc } from "drizzle-orm";

import { createDB } from "../db";

import { reviews } from "../db/schema";

import { authMiddleware } from "../middleware/auth";

const reviewsRoute = new Hono();

async function ensureReviewsTable(env: any) {
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, product_id INTEGER NOT NULL, clerk_user_id TEXT NOT NULL, rating INTEGER NOT NULL, comment TEXT NOT NULL, created_at INTEGER)"
    ).run();
  } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE reviews ADD COLUMN user_name TEXT").run(); } catch (_) {}
  try { await env.DB.prepare("ALTER TABLE reviews ADD COLUMN user_image TEXT").run(); } catch (_) {}
}

// GET PRODUCT REVIEWS
reviewsRoute.get(
  "/:productId",
  async (c) => {

    const productId = Number(
      c.req.param("productId")
    );

    if (isNaN(productId)) {

      return c.json(
        {
          success: false,
          message:
            "Invalid product id",
        },
        400
      );
    }

    try {
      await ensureReviewsTable(c.env);

      const db = createDB(c.env.DB);

      const productReviews =
        await db
          .select()
          .from(reviews)
          .where(
            eq(
              reviews.productId,
              productId
            )
          )
          .orderBy(
            desc(reviews.createdAt)
          );

      return c.json({
        success: true,
        data: productReviews,
      });
    } catch (err: any) {
      return c.json({ success: false, message: err.message }, 500);
    }
  }
);


// CREATE REVIEW
reviewsRoute.post(
  "/",
  authMiddleware,
  async (c) => {

    const user = c.get("user");

    const body =
      await c.req.json();

    if (
      !body.productId ||
      !body.rating ||
      !body.comment
    ) {

      return c.json(
        {
          success: false,
          message:
            "Missing fields",
        },
        400
      );
    }

    try {
    await ensureReviewsTable(c.env);

    const db = createDB(c.env.DB);

    await db.insert(reviews).values({

      productId:
        body.productId,

      clerkUserId:
  user.sub,

userName:
  user.name ||
  user.email,

userImage:
  user.picture,
  
      rating:
        body.rating,

      comment:
        body.comment,
    });

    return c.json({
      success: true,
      message: "Review added successfully",
    });
    } catch (err: any) {
      return c.json({ success: false, message: err.message }, 500);
    }
  }
);

// UPDATE REVIEW
reviewsRoute.put(
  "/:reviewId",
  authMiddleware,
  async (c) => {
    const user = c.get("user");
    const reviewId = Number(c.req.param("reviewId"));
    const body = await c.req.json();
    const db = createDB(c.env.DB);
    try {
      const existing = await db.select().from(reviews).where(eq(reviews.id, reviewId));
      if (!existing.length || existing[0].clerkUserId !== user.sub) {
        return c.json({ success: false, message: "Not authorized" }, 403);
      }
      await db.update(reviews).set({
        rating: body.rating ?? existing[0].rating,
        comment: body.comment ?? existing[0].comment,
      }).where(eq(reviews.id, reviewId));
      return c.json({ success: true, message: "Review updated" });
    } catch (err: any) {
      return c.json({ success: false, message: err.message }, 500);
    }
  }
);

// DELETE REVIEW
reviewsRoute.delete(
  "/:reviewId",
  authMiddleware,
  async (c) => {
    const user = c.get("user");
    const reviewId = Number(c.req.param("reviewId"));
    const db = createDB(c.env.DB);
    try {
      const existing = await db.select().from(reviews).where(eq(reviews.id, reviewId));
      if (!existing.length || existing[0].clerkUserId !== user.sub) {
        return c.json({ success: false, message: "Not authorized" }, 403);
      }
      await db.delete(reviews).where(eq(reviews.id, reviewId));
      return c.json({ success: true, message: "Review deleted" });
    } catch (err: any) {
      return c.json({ success: false, message: err.message }, 500);
    }
  }
);

export default reviewsRoute;