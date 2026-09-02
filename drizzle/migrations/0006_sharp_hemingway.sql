CREATE TABLE `monetura_post_media` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`post_id` bigint unsigned NOT NULL,
	`media_upload_id` bigint unsigned NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_post_media_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_post_media_post_upload` UNIQUE(`post_id`,`media_upload_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_post_media_post` ON `monetura_post_media` (`post_id`);--> statement-breakpoint
CREATE INDEX `idx_post_media_upload` ON `monetura_post_media` (`media_upload_id`);