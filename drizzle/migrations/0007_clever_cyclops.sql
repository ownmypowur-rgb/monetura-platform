CREATE TABLE `monetura_trip_attachments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`trip_id` bigint unsigned NOT NULL,
	`expense_id` bigint unsigned,
	`journal_entry_id` bigint unsigned,
	`type` enum('receipt_photo','vendor_note_photo','signature','audio') NOT NULL,
	`s3_key` varchar(500) NOT NULL,
	`s3_bucket` varchar(255) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`original_filename` varchar(500) NOT NULL,
	`file_size_bytes` bigint unsigned,
	`status` enum('pending','uploaded') NOT NULL DEFAULT 'pending',
	`uploaded_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_trip_attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_trip_expense_revisions` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`expense_id` bigint unsigned NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`previous_values` json NOT NULL,
	`edited_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `monetura_trip_expense_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_trip_expenses` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`trip_id` bigint unsigned NOT NULL,
	`expense_date` date NOT NULL,
	`vendor_name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('airfare','lodging','meals','ground_transport','fees_admissions','equipment_supplies','communications','other') NOT NULL,
	`amount` decimal(15,3) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`exchange_rate` decimal(18,8) NOT NULL,
	`rate_source` enum('bank_of_canada','member_entered','card_statement','not_required') NOT NULL,
	`rate_date` date,
	`cad_amount` decimal(14,2) NOT NULL,
	`payment_method` enum('cash','card','other') NOT NULL,
	`evidence_type` enum('official_receipt','vendor_note','vendor_signature','self_declared') NOT NULL,
	`vendor_signer_name` varchar(255),
	`business_purpose` text,
	`business_use_percent` int NOT NULL DEFAULT 100,
	`ai_assisted` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_trip_expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_trips` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`name` varchar(255) NOT NULL,
	`destinations` varchar(500) NOT NULL,
	`start_date` date NOT NULL,
	`end_date` date NOT NULL,
	`business_purpose` text NOT NULL,
	`trip_type` enum('business','mixed','personal') NOT NULL DEFAULT 'business',
	`business_use_percent` int NOT NULL DEFAULT 100,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_trips_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_trip_attachments_trip` ON `monetura_trip_attachments` (`trip_id`);--> statement-breakpoint
CREATE INDEX `idx_trip_attachments_expense` ON `monetura_trip_attachments` (`expense_id`);--> statement-breakpoint
CREATE INDEX `idx_trip_attachments_journal` ON `monetura_trip_attachments` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_trip_attachments_member` ON `monetura_trip_attachments` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_trip_expense_revisions_expense` ON `monetura_trip_expense_revisions` (`expense_id`);--> statement-breakpoint
CREATE INDEX `idx_trip_expenses_trip` ON `monetura_trip_expenses` (`trip_id`);--> statement-breakpoint
CREATE INDEX `idx_trip_expenses_member_date` ON `monetura_trip_expenses` (`member_id`,`expense_date`);--> statement-breakpoint
CREATE INDEX `idx_trips_member` ON `monetura_trips` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_trips_member_start` ON `monetura_trips` (`member_id`,`start_date`);