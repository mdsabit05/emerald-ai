CREATE TABLE `slider_slides` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `position` integer NOT NULL,
  `label` text NOT NULL,
  `image_url` text DEFAULT '',
  `product_id` integer
);

INSERT INTO slider_slides (position, label, image_url, product_id) VALUES (0, 'The Signature 25g Bar', '', NULL);
INSERT INTO slider_slides (position, label, image_url, product_id) VALUES (1, 'The Emerald''s', '', NULL);
