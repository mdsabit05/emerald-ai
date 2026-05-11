import { drizzle } from "drizzle-orm/d1";

export const createDB = (db: D1Database) => {
  return drizzle(db);
};