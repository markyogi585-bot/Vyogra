CREATE TABLE `bookingAccessGrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`verifiedContactHash` varchar(128) NOT NULL,
	`accessScope` json,
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	`lastUsedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookingAccessGrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookingAccessGrants_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `bookingTermsAcceptances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`packageTermsId` int NOT NULL,
	`acceptedByUserId` int,
	`acceptedByName` varchar(160),
	`acceptanceSource` varchar(48) NOT NULL,
	`acceptedAt` timestamp NOT NULL DEFAULT (now()),
	`ipHash` varchar(128),
	CONSTRAINT `bookingTermsAcceptances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `couponRedemptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`couponId` int NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int,
	`discountAmount` decimal(12,2) NOT NULL,
	`redeemedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `couponRedemptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupon_redemption_booking_unique` UNIQUE(`couponId`,`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(64) NOT NULL,
	`title` varchar(160) NOT NULL,
	`description` text,
	`discountType` enum('flat','percent') NOT NULL,
	`discountValue` decimal(12,2) NOT NULL,
	`minimumSubtotal` decimal(12,2) NOT NULL DEFAULT '0',
	`maximumDiscount` decimal(12,2),
	`startsAt` timestamp,
	`endsAt` timestamp,
	`maxRedemptions` int,
	`redeemedCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `featuredWidgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`featuredWidgetKind` enum('daily_deal','flash_sale','offer','announcement') NOT NULL,
	`packageId` int,
	`couponId` int,
	`imageUrl` text,
	`deepLink` varchar(255),
	`startsAt` timestamp,
	`endsAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featuredWidgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoiceLineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`description` varchar(240) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitAmount` decimal(12,2) NOT NULL,
	`taxRate` decimal(5,2) NOT NULL DEFAULT '0',
	`lineTotal` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoiceLineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(64) NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`invoiceStatus` enum('draft','issued','paid','void','refunded') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(12,2) NOT NULL,
	`taxTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`discountTotal` decimal(12,2) NOT NULL DEFAULT '0',
	`grandTotal` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`billingSnapshot` json,
	`issuedByUserId` int,
	`issuedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`),
	CONSTRAINT `invoices_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE TABLE `mediaAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`originalFileName` varchar(255) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`byteSize` int NOT NULL,
	`folder` varchar(64) NOT NULL,
	`tags` json,
	`uploadedByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mediaAssets_id` PRIMARY KEY(`id`),
	CONSTRAINT `mediaAssets_storageKey_unique` UNIQUE(`storageKey`)
);
--> statement-breakpoint
CREATE TABLE `packageTerms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`revision` varchar(32) NOT NULL,
	`title` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `packageTerms_id` PRIMARY KEY(`id`),
	CONSTRAINT `package_terms_revision_unique` UNIQUE(`packageId`,`revision`)
);
--> statement-breakpoint
CREATE TABLE `tripUpdateMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tripUpdateId` int NOT NULL,
	`storageKey` text NOT NULL,
	`url` text NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`caption` varchar(240),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripUpdateMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`tripUpdateType` enum('update','milestone','notice','safety','media') NOT NULL DEFAULT 'update',
	`title` varchar(220) NOT NULL,
	`body` text NOT NULL,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`tripUpdateVisibility` enum('booking','departure','all_active') NOT NULL DEFAULT 'booking',
	`publishedByUserId` int NOT NULL,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `booking_access_grants_booking_index` ON `bookingAccessGrants` (`bookingId`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `booking_terms_booking_index` ON `bookingTermsAcceptances` (`bookingId`);--> statement-breakpoint
CREATE INDEX `coupon_redemption_coupon_index` ON `couponRedemptions` (`couponId`);--> statement-breakpoint
CREATE INDEX `coupons_active_window_index` ON `coupons` (`isActive`,`endsAt`);--> statement-breakpoint
CREATE INDEX `featured_widgets_active_window_index` ON `featuredWidgets` (`isActive`,`startsAt`,`endsAt`);--> statement-breakpoint
CREATE INDEX `invoice_lines_invoice_index` ON `invoiceLineItems` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `invoices_user_status_index` ON `invoices` (`userId`,`invoiceStatus`);--> statement-breakpoint
CREATE INDEX `media_assets_folder_index` ON `mediaAssets` (`folder`,`createdAt`);--> statement-breakpoint
CREATE INDEX `package_terms_active_index` ON `packageTerms` (`packageId`,`isActive`);--> statement-breakpoint
CREATE INDEX `trip_update_media_update_index` ON `tripUpdateMedia` (`tripUpdateId`);--> statement-breakpoint
CREATE INDEX `trip_updates_booking_time_index` ON `tripUpdates` (`bookingId`,`publishedAt`);
