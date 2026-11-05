CREATE TABLE `monetura_hq_approvals` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`event_id` bigint unsigned NOT NULL,
	`agent_id` varchar(64),
	`decision` enum('approved','rejected') NOT NULL,
	`decided_by` varchar(255) NOT NULL,
	`note` text,
	CONSTRAINT `monetura_hq_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monetura_hq_events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`agent_id` varchar(64),
	`division_id` varchar(64) NOT NULL,
	`task_id` varchar(64),
	`task_title` varchar(255),
	`event_type` enum('task_started','progress','handoff','needs_approval','approved','rejected','completed','blocked') NOT NULL,
	`status` varchar(32),
	`progress` int,
	`from_division_id` varchar(64),
	`to_division_id` varchar(64),
	`payload_json` json,
	`public_safe` boolean NOT NULL DEFAULT false,
	`is_demo` boolean NOT NULL DEFAULT false,
	CONSTRAINT `monetura_hq_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_hq_approvals_event` ON `monetura_hq_approvals` (`event_id`);--> statement-breakpoint
CREATE INDEX `idx_hq_events_created_at` ON `monetura_hq_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_hq_events_division` ON `monetura_hq_events` (`division_id`);--> statement-breakpoint
CREATE INDEX `idx_hq_events_agent` ON `monetura_hq_events` (`agent_id`);--> statement-breakpoint
CREATE INDEX `idx_hq_events_public` ON `monetura_hq_events` (`public_safe`,`created_at`);