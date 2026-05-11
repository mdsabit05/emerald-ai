import { Hono } from "hono";

import {
  adminMiddleware,
} from "../middleware/admin";

import {
  authMiddleware,
} from "../middleware/auth";

import {
  desc,
  eq,
  sql,
} from "drizzle-orm";

import { createDB } from "../db";

import {
  orders,
  orderItems,
  products,
} from "../db/schema";

const ordersRoute = new Hono();


// CREATE ORDER
ordersRoute.post(
  "/",
  authMiddleware,
  async (c) => {

    const user = c.get("user");

    const body =
      await c.req.json();

    const db =
      createDB(c.env.DB);

    let total = 0;

    // VALIDATE PRODUCTS + STOCK
    for (const item of body.items) {

      const product =
        await db
          .select()
          .from(products)
          .where(
            eq(
              products.id,
              item.productId
            )
          );

      if (!product[0]) {

        return c.json(
          {
            success: false,
            message:
              "Product not found",
          },
          404
        );
      }

      // OUT OF STOCK
      if (
        product[0].stock <
        item.quantity
      ) {

        return c.json(
          {
            success: false,
            message:
              `${product[0].name} is out of stock`,
          },
          400
        );
      }

      total +=
        product[0].price *
        item.quantity;
    }

    // CREATE ORDER
    const result =
      await db
        .insert(orders)
        .values({
          clerkUserId:
            user.sub,

          totalAmount:
            total,
        })
        .returning();

    const order =
      result[0];

    // CREATE ORDER ITEMS + REDUCE STOCK
    for (const item of body.items) {

      const product =
        await db
          .select()
          .from(products)
          .where(
            eq(
              products.id,
              item.productId
            )
          );

      // CREATE ORDER ITEM
      await db
        .insert(orderItems)
        .values({

          orderId:
            order.id,

          productId:
            item.productId,

          quantity:
            item.quantity,

          price:
            product[0].price,
        });

      // REDUCE STOCK
      await db
        .update(products)
        .set({
          stock:
            sql`${products.stock} - ${item.quantity}`,
        })
        .where(
          eq(
            products.id,
            item.productId
          )
        );
    }

    return c.json({
      success: true,
      order,
    });
  }
);


// USER ORDERS
ordersRoute.get(
  "/my-orders",
  authMiddleware,
  async (c) => {

    const user =
      c.get("user");

    const db =
      createDB(c.env.DB);

    const userOrders =
      await db
        .select()
        .from(orders)
        .where(
          eq(
            orders.clerkUserId,
            user.sub
          )
        )
        .orderBy(
          desc(
            orders.createdAt
          )
        );

    return c.json({
      success: true,
      data: userOrders,
    });
  }
);


// ADMIN ALL ORDERS
ordersRoute.get(
  "/admin/all",
  authMiddleware,
  adminMiddleware,
  async (c) => {

    const db =
      createDB(c.env.DB);

    const allOrders =
      await db
        .select()
        .from(orders)
        .orderBy(
          desc(
            orders.createdAt
          )
        );

    return c.json({
      success: true,
      data: allOrders,
    });
  }
);


// UPDATE ORDER STATUS
ordersRoute.put(
  "/admin/:id/status",
  authMiddleware,
  adminMiddleware,
  async (c) => {

    const id = Number(
      c.req.param("id")
    );

    const body =
      await c.req.json();

    const db =
      createDB(c.env.DB);

    const existingOrder =
      await db
        .select()
        .from(orders)
        .where(
          eq(
            orders.id,
            id
          )
        );

    if (!existingOrder[0]) {

      return c.json(
        {
          success: false,
          message:
            "Order not found",
        },
        404
      );
    }

    await db
      .update(orders)
      .set({
        status:
          body.status,
      })
      .where(
        eq(
          orders.id,
          id
        )
      );

    return c.json({
      success: true,
      message:
        "Order status updated",
    });
  }
);

export default ordersRoute;