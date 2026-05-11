import { Hono } from "hono";

import { eq, and } from "drizzle-orm";

import { createDB } from "../db";

import {
  wishlists,
  products,
} from "../db/schema";

import { authMiddleware } from "../middleware/auth";

const wishlistRoute =
  new Hono();


// GET USER WISHLIST
wishlistRoute.get(
  "/",
  authMiddleware,
  async (c) => {

    const user =
      c.get("user");

    const db =
      createDB(c.env.DB);

    const wishlistItems =
      await db
        .select({
          wishlistId:
            wishlists.id,

          product:
            products,
        })

        .from(wishlists)

        .innerJoin(
          products,
          eq(
            wishlists.productId,
            products.id
          )
        )

        .where(
          eq(
            wishlists.clerkUserId,
            user.sub
          )
        );

    return c.json({
      success: true,
      data: wishlistItems,
    });
  }
);


// ADD TO WISHLIST
wishlistRoute.post(
  "/:productId",
  authMiddleware,
  async (c) => {

    const user =
      c.get("user");

    const productId =
      Number(
        c.req.param(
          "productId"
        )
      );

    if (
      isNaN(productId)
    ) {

      return c.json(
        {
          success: false,
          message:
            "Invalid product id",
        },
        400
      );
    }

    const db =
      createDB(c.env.DB);

    // CHECK EXISTS
    const existing =
      await db
        .select()
        .from(wishlists)
        .where(
          and(
            eq(
              wishlists.productId,
              productId
            ),

            eq(
              wishlists.clerkUserId,
              user.sub
            )
          )
        );

    if (existing[0]) {

      return c.json({
        success: true,
        message:
          "Already in wishlist",
      });
    }

    await db
      .insert(wishlists)
      .values({

        clerkUserId:
          user.sub,

        productId,
      });

    return c.json({
      success: true,
      message:
        "Added to wishlist",
    });
  }
);


// REMOVE FROM WISHLIST
wishlistRoute.delete(
  "/:productId",
  authMiddleware,
  async (c) => {

    const user =
      c.get("user");

    const productId =
      Number(
        c.req.param(
          "productId"
        )
      );

    const db =
      createDB(c.env.DB);

    await db
      .delete(wishlists)
      .where(
        and(
          eq(
            wishlists.productId,
            productId
          ),

          eq(
            wishlists.clerkUserId,
            user.sub
          )
        )
      );

    return c.json({
      success: true,
      message:
        "Removed from wishlist",
    });
  }
);

export default wishlistRoute;