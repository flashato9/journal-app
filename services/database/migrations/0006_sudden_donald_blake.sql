CREATE TABLE `PageThread` (
	`pageThreadId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`resourceId` text NOT NULL,
	`threadId` text NOT NULL,
	`pageName` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `PageThread_userId_pageName_unique` ON `PageThread` (`userId`,`pageName`);--> statement-breakpoint
ALTER TABLE `User` ADD `companionResourceId` text;--> statement-breakpoint
CREATE UNIQUE INDEX `User_companionResourceId_unique` ON `User` (`companionResourceId`);