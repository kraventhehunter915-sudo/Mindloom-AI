CREATE TABLE `notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`noteId` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`tags` text NOT NULL,
	`folder` varchar(128) NOT NULL,
	`pinned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `notes_user_idx` ON `notes` (`userId`);