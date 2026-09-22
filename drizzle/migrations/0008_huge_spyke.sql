CREATE TABLE `monetura_trip_journal_entries` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`member_id` bigint unsigned NOT NULL,
	`trip_id` bigint unsigned NOT NULL,
	`entry_date` date NOT NULL,
	`raw_text` text,
	`audio_attachment_id` bigint unsigned,
	`transcript` text,
	`transcript_status` enum('none','completed','failed','not_enabled') NOT NULL DEFAULT 'none',
	`transcribed_at` timestamp,
	`ai_summary_first` text,
	`ai_summary` text,
	`summary_status` enum('none','generated','edited') NOT NULL DEFAULT 'none',
	`summary_generated_at` timestamp,
	`summary_edited_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monetura_trip_journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_trip_journal_trip_date` ON `monetura_trip_journal_entries` (`trip_id`,`entry_date`);--> statement-breakpoint
CREATE INDEX `idx_trip_journal_member_date` ON `monetura_trip_journal_entries` (`member_id`,`entry_date`);