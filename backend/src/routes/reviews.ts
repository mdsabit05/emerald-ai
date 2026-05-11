import { Hono } from "hono";

import { eq, desc } from "drizzle-orm";

import { createDB } from "../db";

import { reviews } from "../db/schema";

import { authMiddleware } from "../middleware/auth";

const reviewsRoute = new Hono();


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
      message:
        "Review added successfully",
    });
  }
);

export default reviewsRoute;