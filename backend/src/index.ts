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
    origin: "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({
    success: true,
    message: "API running",
  });
});

app.route("/products", productsRoute);
app.route("/orders", ordersRoute);
app.route("/reviews", reviewsRoute);
app.route(
  "/wishlist",
  wishlistRoute
);

export default app;