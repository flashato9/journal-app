CREATE TABLE `AITimeSummary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timeMemoryId` integer NOT NULL,
	`summary` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`timeMemoryId`) REFERENCES `TimeMemory`(`id`) ON UPDATE no action ON DELETE no action
);
