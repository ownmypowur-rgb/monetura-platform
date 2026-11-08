CREATE TABLE `monetura_waitlist` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('subscribed','unsubscribed') NOT NULL DEFAULT 'subscribed',
	`consent_text` text NOT NULL,
	`consent_version` varchar(20) NOT NULL,
	`consented_at` timestamp NOT NULL,
	`consent_page` varchar(500),
	`ip_hash` varchar(64),
	`unsubscribe_token` varchar(64) NOT NULL,
	`confirmation_sent_at` timestamp,
	`unsubscribed_at` timestamp,
	`utm_source` varchar(100),
	`utm_medium` varchar(100),
	`utm_campaign` varchar(100),
	`referrer` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_waitlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_waitlist_email` UNIQUE(`email`),
	CONSTRAINT `uq_waitlist_unsubscribe_token` UNIQUE(`unsubscribe_token`)
);
--> statement-breakpoint
CREATE INDEX `idx_waitlist_status` ON `monetura_waitlist` (`status`);--> statement-breakpoint
CREATE INDEX `idx_waitlist_created_at` ON `monetura_waitlist` (`created_at`);