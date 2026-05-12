import { Hono } from "hono";
import { eq , sql } from "drizzle-orm";
import { adminMiddleware } from "../middleware/admin";
import { createDB } from "../db";
import {
  products,
  reviews,
} from "../db/schema";
import { createProductSchema } from "../validators/product";
import { authMiddleware } from "../middleware/auth";
const productsRoute = new Hono();


// GET ALL PRODUCTS
productsRoute.get(
  "/",
  async (c) => {

    const db =
      createDB(c.env.DB);

    const allProducts =
      await db
        .select({

          id:
            products.id,

          name:
            products.name,

          description:
            products.description,

          price:
            products.price,

          imageUrl:
            products.imageUrl,

          stock:
            products.stock,

          category:
            products.category,

          avgRating:
            sql<number>`
              ROUND(
                AVG(
                  ${reviews.rating}
                ),
                1
              )
            `,

          reviewCount:
            sql<number>`
              COUNT(
                ${reviews.id}
              )
            `,
        })

        .from(products)

        .leftJoin(
          reviews,
          eq(
            products.id,
            reviews.productId
          )
        )

        .groupBy(
          products.id
        );

    return c.json({
      success: true,
      data: allProducts,
    });
  }
);


// GET SINGLE PRODUCT
productsRoute.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));

  if (isNaN(id)) {
    return c.json(
      {
        success: false,
        message: "Invalid product ID",
      },
      400
    );
  }

  const db = createDB(c.env.DB);

  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, id));

  if (!product[0]) {
    return c.json(
      {
        success: false,
        message: "Product not found",
      },
      404
    );
  }

  return c.json({
    success: true,
    data: product[0],
  });
});


// CREATE PRODUCT
productsRoute.post(
  "/",
  authMiddleware,
  adminMiddleware,
  async (c) => {
  const body = await c.req.json();

  const validatedData = createProductSchema.safeParse(body);

  if (!validatedData.success) {
    const message = validatedData.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    return c.json(
      {
        success: false,
        message,
      },
      400
    );
  }

  const db = createDB(c.env.DB);

  await db.insert(products).values(validatedData.data);

  return c.json(
    {
      success: true,
      message: "Product created successfully",
    },
    201
  );
});


// UPDATE PRODUCT
productsRoute.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (c) => {
    const id = Number(c.req.param("id"));

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message: "Invalid product ID",
        },
        400
      );
    }

    const body = await c.req.json();

    const validatedData = createProductSchema.safeParse(body);

    if (!validatedData.success) {
      const message = validatedData.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return c.json(
        {
          success: false,
          message,
        },
        400
      );
    }

    const db = createDB(c.env.DB);

    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!existingProduct[0]) {
      return c.json(
        {
          success: false,
          message: "Product not found",
        },
        404
      );
    }

    await db
      .update(products)
      .set(validatedData.data)
      .where(eq(products.id, id));

    return c.json({
      success: true,
      message: "Product updated successfully",
    });
  }
);


// DELETE PRODUCT
productsRoute.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (c) => {

    const id = Number(
      c.req.param("id")
    );

    if (isNaN(id)) {
      return c.json(
        {
          success: false,
          message:
            "Invalid product ID",
        },
        400
      );
    }

    const db = createDB(c.env.DB);

    const existingProduct =
      await db
        .select()
        .from(products)
        .where(
          eq(products.id, id)
        );

    if (!existingProduct[0]) {
      return c.json(
        {
          success: false,
          message:
            "Product not found",
        },
        404
      );
    }

    await db
      .delete(products)
      .where(
        eq(products.id, id)
      );

    return c.json({
      success: true,
      message:
        "Product deleted successfully",
    });
  }
);

export default productsRoute;