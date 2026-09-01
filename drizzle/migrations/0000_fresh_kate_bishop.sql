CREATE TABLE `monetura_affiliate_clicks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`link_id` bigint unsigned NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` varchar(1000),
	`clicked_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_affiliate_clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_affiliate_links` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`code` varchar(50) NOT NULL,
	`label` varchar(255),
	`destination_url` varchar(1000) NOT NULL,
	`commission_rate` decimal(5,4) NOT NULL DEFAULT '0.1000',
	`is_active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_affiliate_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_affiliate_links_code_unique` UNIQUE(`code`),
	CONSTRAINT `idx_affiliate_links_code` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `monetura_challenge_entries` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`challenge_id` bigint unsigned NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`submission_url` varchar(1000),
	`notes` text,
	`status` enum('submitted','approved','rejected') NOT NULL DEFAULT 'submitted',
	`reviewed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_challenge_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_challenges` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`start_date` timestamp,
	`end_date` timestamp,
	`credit_reward` int NOT NULL DEFAULT 0,
	`status` enum('upcoming','active','completed') NOT NULL DEFAULT 'upcoming',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_commissions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`affiliate_member_id` bigint unsigned NOT NULL,
	`referred_member_id` bigint unsigned,
	`link_id` bigint unsigned,
	`amount_cents` int NOT NULL DEFAULT 0,
	`currency` varchar(3) NOT NULL DEFAULT 'CAD',
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_content_posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`author_id` bigint unsigned NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`body` text,
	`excerpt` text,
	`cover_image_url` varchar(500),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`content_type` enum('article','update','announcement','lesson') NOT NULL DEFAULT 'article',
	`tags` json,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_content_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_content_posts_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `idx_content_posts_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `monetura_credit_packages` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`credits` int NOT NULL,
	`price_cents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'CAD',
	`is_active` boolean NOT NULL DEFAULT true,
	`stripe_price_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_credit_packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_credit_usage` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`credits` int NOT NULL,
	`direction` enum('debit','credit') NOT NULL,
	`reason` varchar(500),
	`reference_id` varchar(255),
	`balance_after` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_credit_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_email_sequences` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`sequence_name` varchar(255) NOT NULL,
	`step_number` int NOT NULL DEFAULT 1,
	`status` enum('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`scheduled_at` timestamp,
	`sent_at` timestamp,
	`resend_email_id` varchar(255),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_email_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_founder_keys` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`key_code` varchar(64) NOT NULL,
	`founder_tier` enum('bronze','silver','gold') NOT NULL DEFAULT 'bronze',
	`purchase_amount` decimal(10,2),
	`purchase_method` enum('etransfer','wire'),
	`activated_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_founder_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_founder_keys_key_code_unique` UNIQUE(`key_code`),
	CONSTRAINT `idx_founder_keys_code` UNIQUE(`key_code`)
);
--> statement-breakpoint
CREATE TABLE `monetura_media_uploads` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`uploader_id` bigint unsigned NOT NULL,
	`s3_key` varchar(500) NOT NULL,
	`s3_bucket` varchar(255) NOT NULL,
	`file_name` varchar(500) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`file_size_bytes` bigint unsigned,
	`public_url` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_media_uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_members` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(50),
	`reference_code` varchar(10),
	`referred_by` varchar(10),
	`membership_tier` enum('free','community','software','founder') NOT NULL DEFAULT 'free',
	`status` enum('pending','active','suspended','cancelled') NOT NULL DEFAULT 'pending',
	`country` varchar(100),
	`city` varchar(100),
	`bio` text,
	`avatar_url` varchar(500),
	`stripe_customer_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_members_email_unique` UNIQUE(`email`),
	CONSTRAINT `idx_members_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `monetura_milestones` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`achieved_at` timestamp,
	`proof_url` varchar(500),
	`is_public` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_social_accounts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`platform` enum('instagram','tiktok','youtube','twitter','linkedin','facebook') NOT NULL,
	`handle` varchar(255) NOT NULL,
	`profile_url` varchar(500),
	`follower_count` int,
	`is_verified` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_social_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_stripe_customers` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`stripe_customer_id` varchar(255) NOT NULL,
	`stripe_subscription_id` varchar(255),
	`subscription_status` enum('active','past_due','cancelled','trialing','unpaid'),
	`current_period_end` timestamp,
	`plan_id` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_stripe_customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_stripe_customers_member_id_unique` UNIQUE(`member_id`),
	CONSTRAINT `monetura_stripe_customers_stripe_customer_id_unique` UNIQUE(`stripe_customer_id`),
	CONSTRAINT `idx_stripe_customers_member` UNIQUE(`member_id`),
	CONSTRAINT `idx_stripe_customers_stripe_id` UNIQUE(`stripe_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_travel_bookings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`destination` varchar(500) NOT NULL,
	`departure_date` timestamp,
	`return_date` timestamp,
	`traveler_count` int NOT NULL DEFAULT 1,
	`total_amount_cents` int,
	`currency` varchar(3) NOT NULL DEFAULT 'CAD',
	`status` enum('inquiry','quoted','confirmed','completed','cancelled') NOT NULL DEFAULT 'inquiry',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_travel_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_affiliate_clicks_link` ON `monetura_affiliate_clicks` (`link_id`);--> statement-breakpoint
CREATE INDEX `idx_affiliate_clicks_at` ON `monetura_affiliate_clicks` (`clicked_at`);--> statement-breakpoint
CREATE INDEX `idx_affiliate_links_member` ON `monetura_affiliate_links` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_challenge_entries_challenge` ON `monetura_challenge_entries` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `idx_challenge_entries_member` ON `monetura_challenge_entries` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_commissions_affiliate` ON `monetura_commissions` (`affiliate_member_id`);--> statement-breakpoint
CREATE INDEX `idx_commissions_status` ON `monetura_commissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_content_posts_author` ON `monetura_content_posts` (`author_id`);--> statement-breakpoint
CREATE INDEX `idx_content_posts_status` ON `monetura_content_posts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_credit_usage_member` ON `monetura_credit_usage` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_credit_usage_created` ON `monetura_credit_usage` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_email_sequences_member` ON `monetura_email_sequences` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_email_sequences_status` ON `monetura_email_sequences` (`status`);--> statement-breakpoint
CREATE INDEX `idx_email_sequences_scheduled` ON `monetura_email_sequences` (`scheduled_at`);--> statement-breakpoint
CREATE INDEX `idx_founder_keys_member` ON `monetura_founder_keys` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_media_uploads_uploader` ON `monetura_media_uploads` (`uploader_id`);--> statement-breakpoint
CREATE INDEX `idx_members_reference_code` ON `monetura_members` (`reference_code`);--> statement-breakpoint
CREATE INDEX `idx_milestones_member` ON `monetura_milestones` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_social_accounts_member` ON `monetura_social_accounts` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_travel_bookings_member` ON `monetura_travel_bookings` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_travel_bookings_status` ON `monetura_travel_bookings` (`status`);