CREATE TABLE `CompanionFieldVisibility` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`screenKey` text NOT NULL,
	`fieldKey` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `CompanionFieldVisibility_userId_screenKey_fieldKey_unique` ON `CompanionFieldVisibility` (`userId`,`screenKey`,`fieldKey`);