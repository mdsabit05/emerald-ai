import { Hono } from "hono";
import productsRoute from "./routes/products";
import { cors } from "hono/cors";
import ordersRoute from "./routes/orders";
import reviewsRoute from "./routes/reviews";
import wishlistRoute from "./routes/wishlist";
import addressesRoute from "./routes/addresses";
import sliderRoute from "./routes/slider";

type Bindings = {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
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

app.get("/api", (c) => {
  return c.json({
    success: true,
    message: "API running",
  });
});

app.route("/api/products", productsRoute);
app.route("/api/orders", ordersRoute);
app.route("/api/reviews", reviewsRoute);
app.route("/api/wishlist", wishlistRoute);
app.route("/api/addresses", addressesRoute);
app.route("/api/slider", sliderRoute);

export default app;