ALTER TABLE `monetura_members` MODIFY COLUMN `membership_tier` enum('free','community','software','founder','admin') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `monetura_members` MODIFY COLUMN `status` enum('pending','active','suspended','cancelled','awaiting_payment') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `monetura_members` ADD `province` varchar(100);--> statement-breakpoint
ALTER TABLE `monetura_members` ADD `tier_interest` enum('entry','core','elite','platinum');--> statement-breakpoint
ALTER TABLE `monetura_members` ADD `heard_about` varchar(500);--> statement-breakpoint
ALTER TABLE `monetura_members` ADD `founder_number` int;