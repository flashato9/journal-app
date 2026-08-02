CREATE TABLE `AIDaySummary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dayMemoryId` integer NOT NULL,
	`summary` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`dayMemoryId`) REFERENCES `DayMemory`(`id`) ON UPDATE no action ON DELETE no action
);
