ALTER TABLE `monetura_content_posts` ADD `instagram_caption` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `instagram_hashtags` json;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `facebook_caption` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `linkedin_caption` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `tiktok_caption` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `blog_title` varchar(500);--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `blog_body` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `blog_excerpt` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `magazine_title` varchar(500);--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `magazine_intro` text;--> statement-breakpoint
ALTER TABLE `monetura_content_posts` ADD `ai_credits_used` int DEFAULT 0 NOT NULL;