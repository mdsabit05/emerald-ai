import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),

  description: text("description").notNull(),

  price: integer("price").notNull(),

  imageUrl: text("image_url").notNull(),

  stock: integer("stock").default(0),

  category: text("category").notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({
    autoIncrement: true,
  }),

  clerkUserId: text("clerk_user_id")
    .notNull(),

  totalAmount: integer("total_amount")
    .notNull(),

  status: text("status")
    .default("pending"),

  createdAt: text("created_at")
    .default(sql`CURRENT_TIMESTAMP`),
});

export const orderItems = sqliteTable(
  "order_items",
  {
    id: integer("id").primaryKey({
      autoIncrement: true,
    }),

    orderId: integer("order_id")
      .notNull(),

    productId: integer("product_id")
      .notNull(),

    quantity: integer("quantity")
      .notNull(),

    price: integer("price")
      .notNull(),
  }
);

export const reviews =
sqliteTable("reviews", {

  id: integer("id")
    .primaryKey({
      autoIncrement: true,
    }),

  productId:
    integer("product_id")
      .notNull(),

      userName:
  text("user_name"),

userImage:
  text("user_image"),

  clerkUserId:
    text("clerk_user_id")
      .notNull(),

  rating:
    integer("rating")
      .notNull(),

  comment:
    text("comment")
      .notNull(),

  createdAt:
    integer("created_at", {
      mode: "timestamp",
    }).$defaultFn(
      () => new Date()
    ),
});

export const wishlists =
sqliteTable("wishlists", {

  id: integer("id")
    .primaryKey({
      autoIncrement: true,
    }),

  clerkUserId:
    text("clerk_user_id")
      .notNull(),

  productId:
    integer("product_id")
      .notNull(),

  createdAt:
    integer("created_at", {
      mode: "timestamp",
    }).$defaultFn(
      () => new Date()
    ),
});