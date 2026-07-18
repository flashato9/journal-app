CREATE TABLE IF NOT EXISTS `DayMemory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`day` text NOT NULL,
	`summary` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`lastUpdatedTime` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Location` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`altitude` real,
	`createdDateTime` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `LocationSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`fetchFrequency` integer DEFAULT 10 NOT NULL,
	`notificationThreshold` real DEFAULT 1 NOT NULL,
	`restThreshold` integer DEFAULT 10 NOT NULL,
	`locationTrackingPollFrequency` integer DEFAULT 15 NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`lastUpdatedTime` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `LocationSettings_userId_unique` ON `LocationSettings` (`userId`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `Notification` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`notificationMessage` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `TimeMemory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dayMemoryId` integer NOT NULL,
	`locationId` integer,
	`timeOfRecord` text NOT NULL,
	`summary` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`lastUpdatedTime` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`dayMemoryId`) REFERENCES `DayMemory`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`locationId`) REFERENCES `Location`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `TimeMemoryMedia` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timeMemoryId` integer NOT NULL,
	`mediaUri` text NOT NULL,
	`mediaType` text DEFAULT 'image' NOT NULL,
	`mediaLibraryAssetId` text,
	`lastUpdatedTime` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`timeMemoryId`) REFERENCES `TimeMemory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `TimeMemoryQA` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timeMemoryId` integer NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`lastUpdatedTime` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`timeMemoryId`) REFERENCES `TimeMemory`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `User` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`profileImagePath` text,
	`preferredLoginMethod` text,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `User_username_unique` ON `User` (`username`);