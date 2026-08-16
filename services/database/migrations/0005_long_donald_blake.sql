CREATE TABLE `AppSettings` (
	`settingId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`settingSchemaId` integer NOT NULL,
	`settingValue` text NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`settingSchemaId`) REFERENCES `AppSettingSchema`(`settingSchemaId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AppSettings_userId_settingSchemaId_unique` ON `AppSettings` (`userId`,`settingSchemaId`);--> statement-breakpoint
CREATE TABLE `AppSettingSchema` (
	`settingSchemaId` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`settingSchemaName` text NOT NULL,
	`settingSchemaDescription` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AppSettingSchema_settingSchemaName_unique` ON `AppSettingSchema` (`settingSchemaName`);