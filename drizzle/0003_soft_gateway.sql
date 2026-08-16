CREATE TABLE `externalIdentities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(48) NOT NULL,
	`providerSubject` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`claims` json,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `externalIdentities_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_identity_provider_subject_unique` UNIQUE(`provider`,`providerSubject`)
);
--> statement-breakpoint
CREATE TABLE `packageDraftRevisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`revision` int NOT NULL,
	`payload` json NOT NULL,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packageDraftRevisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `package_draft_revision_unique` UNIQUE(`packageId`,`revision`)
);
--> statement-breakpoint
CREATE TABLE `packageTranslations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`locale` varchar(8) NOT NULL,
	`name` varchar(220) NOT NULL,
	`summary` text NOT NULL,
	`destination` varchar(220) NOT NULL,
	`inclusions` json,
	`exclusions` json,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packageTranslations_id` PRIMARY KEY(`id`),
	CONSTRAINT `package_translation_locale_unique` UNIQUE(`packageId`,`locale`)
);
--> statement-breakpoint
CREATE TABLE `tripLocationCheckins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`accuracyMeters` int,
	`label` varchar(220),
	`note` text,
	`tripLocationVisibility` enum('booking','departure','all_active') NOT NULL DEFAULT 'booking',
	`source` varchar(48) NOT NULL DEFAULT 'host_manual',
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripLocationCheckins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLocale` varchar(8) DEFAULT 'en-IN' NOT NULL;--> statement-breakpoint
CREATE INDEX `external_identity_user_index` ON `externalIdentities` (`userId`);--> statement-breakpoint
CREATE INDEX `package_draft_revision_package_index` ON `packageDraftRevisions` (`packageId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `trip_location_booking_time_index` ON `tripLocationCheckins` (`bookingId`,`capturedAt`);