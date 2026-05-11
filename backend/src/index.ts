import { Hono } from "hono";
import productsRoute from "./routes/products";
import { cors } from "hono/cors";
import ordersRoute from "./routes/orders";
import reviewsRoute from "./routes/reviews";
import wishlistRoute from "./routes/wishlist";


type Bindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(
  "*",
  cors({
    origin: "http://localhost:34521",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

const api = app.basePath("/api");

api.get("/", (c) => {
  return c.json({
    success: true,
    message: "API running",
  });
});

api.route("/products", productsRoute);
api.route("/orders", ordersRoute);
api.route("/reviews", reviewsRoute);
api.route("/wishlist", wishlistRoute);

export default app;