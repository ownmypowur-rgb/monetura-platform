CREATE TABLE `monetura_bundle_teams` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`bundle_team_id` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_bundle_teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_bundle_teams_member_id_unique` UNIQUE(`member_id`),
	CONSTRAINT `idx_bundle_teams_member` UNIQUE(`member_id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_password_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`user_id` bigint unsigned NOT NULL,
	`token` varchar(128) NOT NULL,
	`purpose` enum('set_password','reset_password') NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_password_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `monetura_password_tokens_token_unique` UNIQUE(`token`),
	CONSTRAINT `idx_password_tokens_token` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `monetura_media_uploads` ADD `status` enum('pending','uploaded','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_password_tokens_user` ON `monetura_password_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_media_uploads_status` ON `monetura_media_uploads` (`status`);