// import { verifyToken } from "@clerk/backend";
// import { createMiddleware } from "hono/factory";

// export const authMiddleware = createMiddleware(async (c, next) => {
//   const authHeader = c.req.header("Authorization");

//   if (!authHeader) {
//     return c.json(
//       {
//         success: false,
//         message: "Unauthorized",
//       },
//       401
//     );
//   }

//   const token = authHeader.replace("Bearer ", "");

//   try {
//     const session = await verifyToken(token, {
//   secretKey: c.env.CLERK_SECRET_KEY,
// });

//     c.set("user", session);

//     await next();
//   } catch {
//     return c.json(
//       {
//         success: false,
//         message: "Invalid token",
//       },
//       401
//     );
//   }
// });

import { createMiddleware } from "hono/factory";
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://quality-skunk-32.clerk.accounts.dev/.well-known/jwks.json"
  )
);

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader) {
    return c.json(
      {
        success: false,
        message: "Unauthorized",
      },
      401
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);

    c.set("user", payload);

    await next();
  } catch (error) {
    console.error("TOKEN ERROR:", error);

    return c.json(
      {
        success: false,
        message: "Invalid token",
      },
      401
    );
  }
});