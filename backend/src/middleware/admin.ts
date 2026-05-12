import { createMiddleware } from "hono/factory";

type Bindings = {
  CLERK_SECRET_KEY: string;
};

export const adminMiddleware = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
  const user = c.get("user");

  // If role is already in the JWT payload (via Clerk session token customization)
  if (user.role === "admin") {
    await next();
    return;
  }

  // Fallback: fetch user from Clerk API and check public_metadata
  try {
    const res = await fetch(
      `https://api.clerk.com/v1/users/${user.sub}`,
      {
        headers: {
          Authorization: `Bearer ${c.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    const clerkUser = await res.json() as {
      public_metadata?: { role?: string };
    };

    if (clerkUser.public_metadata?.role !== "admin") {
      return c.json({ success: false, message: "Forbidden" }, 403);
    }
  } catch {
    return c.json({ success: false, message: "Forbidden" }, 403);
  }

  await next();
});
