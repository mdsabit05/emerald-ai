
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`clerk_user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` integer
);
