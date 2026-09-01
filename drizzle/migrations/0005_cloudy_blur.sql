CREATE TABLE `monetura_event_registrations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`event_id` bigint unsigned NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`status` enum('registered','cancelled') NOT NULL DEFAULT 'registered',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_event_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_event_reg_member_event` UNIQUE(`event_id`,`member_id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(500) NOT NULL,
	`type` varchar(100) NOT NULL,
	`type_dot` varchar(16) NOT NULL DEFAULT '#D4A853',
	`date_label` varchar(100) NOT NULL,
	`end_date_label` varchar(100),
	`duration` varchar(50),
	`location` varchar(255) NOT NULL,
	`country` varchar(100),
	`hero_image` varchar(1000),
	`tagline` varchar(500),
	`description` text,
	`included` json,
	`price_label` varchar(255),
	`price_note` varchar(500),
	`cta_label` varchar(100) NOT NULL DEFAULT 'Express Interest',
	`is_published` boolean NOT NULL DEFAULT true,
	`sort_date` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_events_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `idx_events_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `monetura_marketplace_products` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(500) NOT NULL,
	`brand` varchar(255) NOT NULL,
	`category` varchar(50) NOT NULL,
	`description` text,
	`long_description` text,
	`public_price` int NOT NULL,
	`member_price` int NOT NULL,
	`savings_percent` int NOT NULL DEFAULT 0,
	`image` varchar(1000),
	`images` json,
	`tags` json,
	`checkout_type` enum('external','contact') NOT NULL DEFAULT 'external',
	`external_url` varchar(1000),
	`in_stock` boolean NOT NULL DEFAULT true,
	`featured` boolean NOT NULL DEFAULT false,
	`submitted_by_member` boolean NOT NULL DEFAULT false,
	`approved_at` timestamp,
	`is_published` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_marketplace_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_marketplace_products_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `idx_marketplace_products_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `monetura_marketplace_submissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`product_name` varchar(500) NOT NULL,
	`brand` varchar(255) NOT NULL,
	`category` varchar(50) NOT NULL,
	`public_price` decimal(10,2),
	`member_price` decimal(10,2),
	`description` text,
	`product_url` varchar(1000),
	`image_url` varchar(1000),
	`notes` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_marketplace_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_event_reg_member` ON `monetura_event_registrations` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_events_sort_date` ON `monetura_events` (`sort_date`);--> statement-breakpoint
CREATE INDEX `idx_marketplace_products_category` ON `monetura_marketplace_products` (`category`);--> statement-breakpoint
CREATE INDEX `idx_marketplace_submissions_status` ON `monetura_marketplace_submissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_marketplace_submissions_member` ON `monetura_marketplace_submissions` (`member_id`);