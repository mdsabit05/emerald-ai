CREATE TABLE `wishlists` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `clerk_user_id` text NOT NULL,
  `product_id` integer NOT NULL,
  `created_at` integer
);