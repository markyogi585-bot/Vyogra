CREATE TABLE `supportChannels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supportChannelType` enum('whatsapp','email','phone') NOT NULL,
	`label` varchar(80) NOT NULL,
	`destination` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportChannels_id` PRIMARY KEY(`id`),
	CONSTRAINT `supportChannels_supportChannelType_unique` UNIQUE(`supportChannelType`)
);
--> statement-breakpoint
CREATE TABLE `supportTicketReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`authorUserId` int NOT NULL,
	`body` text NOT NULL,
	`visibleToTraveler` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supportTicketReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bookingTravelers` ADD `travelerCategory` enum('adult','child','infant') DEFAULT 'adult' NOT NULL;--> statement-breakpoint
ALTER TABLE `bookingTravelers` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `bookingTravelers` ADD `guardianName` varchar(160);--> statement-breakpoint
ALTER TABLE `bookingTravelers` ADD `guardianPhone` varchar(32);--> statement-breakpoint
ALTER TABLE `bookingTravelers` ADD `guardianConsentAt` timestamp;--> statement-breakpoint
CREATE INDEX `support_replies_ticket_index` ON `supportTicketReplies` (`ticketId`,`createdAt`);