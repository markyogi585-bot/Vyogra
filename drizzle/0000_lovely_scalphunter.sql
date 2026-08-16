CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`imageUrl` text,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`eventType` varchar(96) NOT NULL,
	`entityType` varchar(96) NOT NULL,
	`entityId` varchar(96),
	`metadata` json,
	`requestId` varchar(96),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookingTravelers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`fullName` varchar(160) NOT NULL,
	`phone` varchar(32),
	`email` varchar(320),
	`emergencyPhone` varchar(32),
	`dietaryNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookingTravelers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingCode` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`packageId` int NOT NULL,
	`departureId` int,
	`bookingStatus` enum('pending','confirmed','active','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`travelerCount` int NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`addOnTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`walletApplied` decimal(12,2) NOT NULL DEFAULT '0',
	`grandTotal` decimal(12,2) NOT NULL,
	`notes` text,
	`confirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookings_bookingCode_unique` UNIQUE(`bookingCode`)
);
--> statement-breakpoint
CREATE TABLE `broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`audience` varchar(80) NOT NULL,
	`deepLink` varchar(255),
	`imageUrl` text,
	`status` varchar(24) NOT NULL DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`category` varchar(64) NOT NULL,
	`costPerTraveler` decimal(12,2) NOT NULL,
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`capacity` int NOT NULL,
	`bookedCount` int NOT NULL DEFAULT 0,
	`price` decimal(12,2) NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `departures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bookingId` int,
	`uploadedByUserId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`storageKey` text NOT NULL,
	`url` text NOT NULL,
	`category` varchar(48) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otpAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(32) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otpAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packageDays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`title` varchar(220) NOT NULL,
	`description` text,
	`location` varchar(220),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`activities` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packageDays_id` PRIMARY KEY(`id`),
	CONSTRAINT `package_day_unique` UNIQUE(`packageId`,`dayNumber`)
);
--> statement-breakpoint
CREATE TABLE `packageMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`storageKey` text NOT NULL,
	`url` text NOT NULL,
	`alt` varchar(220),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packageMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(220) NOT NULL,
	`summary` text NOT NULL,
	`destination` varchar(220) NOT NULL,
	`category` varchar(64) NOT NULL,
	`durationDays` int NOT NULL,
	`durationNights` int NOT NULL,
	`groupMin` int NOT NULL DEFAULT 1,
	`groupMax` int NOT NULL DEFAULT 12,
	`basePrice` decimal(12,2) NOT NULL,
	`coverImageUrl` text,
	`tags` json,
	`inclusions` json,
	`exclusions` json,
	`packageStatus` enum('draft','published','paused','archived') NOT NULL DEFAULT 'draft',
	`createdByUserId` int NOT NULL,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `packages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`provider` varchar(48) NOT NULL,
	`providerOrderId` varchar(160),
	`providerPaymentId` varchar(160),
	`paymentStatus` enum('created','authorized','paid','failed','refunded') NOT NULL DEFAULT 'created',
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_provider_payment_unique` UNIQUE(`providerPaymentId`)
);
--> statement-breakpoint
CREATE TABLE `reviewMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`storageKey` text NOT NULL,
	`url` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviewMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`packageId` int NOT NULL,
	`rating` int NOT NULL,
	`body` text NOT NULL,
	`tags` json,
	`reviewStatus` enum('pending','published','rejected','removed') NOT NULL DEFAULT 'pending',
	`moderatedByUserId` int,
	`moderatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`),
	CONSTRAINT `reviews_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketCode` varchar(32) NOT NULL,
	`userId` int NOT NULL,
	`bookingId` int,
	`subject` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`ticketStatus` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`assignedToUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `supportTickets_ticketCode_unique` UNIQUE(`ticketCode`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` varchar(160),
	`email` varchar(320),
	`phone` varchar(32),
	`avatarUrl` text,
	`loginMethod` varchar(64),
	`accountRole` enum('user','sub_admin','admin','super_admin') NOT NULL DEFAULT 'user',
	`loyaltyTier` varchar(24) NOT NULL DEFAULT 'explorer',
	`lifetimeSpend` decimal(12,2) NOT NULL DEFAULT '0',
	`isSuspended` boolean NOT NULL DEFAULT false,
	`suspendedUntil` timestamp,
	`isBanned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `walletTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`walletId` int NOT NULL,
	`type` varchar(32) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`referenceType` varchar(48),
	`referenceId` varchar(96),
	`description` varchar(240) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walletTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` decimal(12,2) NOT NULL DEFAULT '0',
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `wishlistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`wishlistId` int NOT NULL,
	`packageId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlistItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlist_item_unique` UNIQUE(`wishlistId`,`packageId`)
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`shareToken` varchar(96),
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlists_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE INDEX `audit_events_entity_index` ON `auditEvents` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `audit_events_actor_index` ON `auditEvents` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `booking_travelers_booking_index` ON `bookingTravelers` (`bookingId`);--> statement-breakpoint
CREATE INDEX `bookings_user_status_index` ON `bookings` (`userId`,`bookingStatus`);--> statement-breakpoint
CREATE INDEX `bookings_package_index` ON `bookings` (`packageId`);--> statement-breakpoint
CREATE INDEX `broadcasts_status_scheduled_index` ON `broadcasts` (`status`,`scheduledAt`);--> statement-breakpoint
CREATE INDEX `budget_lines_package_index` ON `budgetLines` (`packageId`);--> statement-breakpoint
CREATE INDEX `departures_package_date_index` ON `departures` (`packageId`,`startsAt`);--> statement-breakpoint
CREATE INDEX `documents_user_index` ON `documents` (`userId`);--> statement-breakpoint
CREATE INDEX `documents_booking_index` ON `documents` (`bookingId`);--> statement-breakpoint
CREATE INDEX `otp_attempts_phone_index` ON `otpAttempts` (`phone`,`createdAt`);--> statement-breakpoint
CREATE INDEX `package_media_package_index` ON `packageMedia` (`packageId`);--> statement-breakpoint
CREATE INDEX `packages_status_index` ON `packages` (`packageStatus`);--> statement-breakpoint
CREATE INDEX `packages_category_index` ON `packages` (`category`);--> statement-breakpoint
CREATE INDEX `packages_creator_index` ON `packages` (`createdByUserId`);--> statement-breakpoint
CREATE INDEX `payments_booking_index` ON `payments` (`bookingId`);--> statement-breakpoint
CREATE INDEX `review_media_review_index` ON `reviewMedia` (`reviewId`);--> statement-breakpoint
CREATE INDEX `reviews_package_status_index` ON `reviews` (`packageId`,`reviewStatus`);--> statement-breakpoint
CREATE INDEX `reviews_user_index` ON `reviews` (`userId`);--> statement-breakpoint
CREATE INDEX `support_tickets_user_index` ON `supportTickets` (`userId`);--> statement-breakpoint
CREATE INDEX `support_tickets_status_index` ON `supportTickets` (`ticketStatus`);--> statement-breakpoint
CREATE INDEX `users_role_index` ON `users` (`accountRole`);--> statement-breakpoint
CREATE INDEX `wallet_transactions_wallet_index` ON `walletTransactions` (`walletId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `wishlists_user_index` ON `wishlists` (`userId`);