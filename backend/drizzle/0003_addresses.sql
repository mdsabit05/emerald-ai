CREATE TABLE `addresses` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `clerk_user_id` text NOT NULL,
  `name` text NOT NULL,
  `phone` text NOT NULL,
  `address` text NOT NULL,
  `city` text NOT NULL,
  `state` text NOT NULL,
  `pincode` text NOT NULL
);
