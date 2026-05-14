import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(3),

  description: z.string().min(1),

  price: z.number().positive(),

  imageUrl: z.string(),

  images: z.array(z.string()).optional().default([]),

  stock: z.number().min(0),

  category: z.string(),
});