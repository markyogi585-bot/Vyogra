CREATE TABLE `bookingAdjustments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`invoiceId` int,
	`bookingAdjustmentKind` enum('additional_charge','credit') NOT NULL,
	`description` varchar(240) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`taxRate` decimal(5,2) NOT NULL DEFAULT '0',
	`bookingAdjustmentStatus` enum('proposed','issued','paid','void') NOT NULL DEFAULT 'proposed',
	`issuedByUserId` int NOT NULL,
	`voidedByUserId` int,
	`voidReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingAdjustments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookingCancellationRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`requestedByUserId` int,
	`reason` text NOT NULL,
	`requestedRefundAmount` decimal(12,2),
	`bookingChangeStatus` enum('requested','reviewing','approved','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`operatorNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingCancellationRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookingExtensionRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`requestedByUserId` int,
	`requestedStartAt` timestamp,
	`requestedEndAt` timestamp,
	`additionalDays` int NOT NULL DEFAULT 0,
	`reason` text NOT NULL,
	`bookingChangeStatus` enum('requested','reviewing','approved','rejected','cancelled') NOT NULL DEFAULT 'requested',
	`operatorNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingExtensionRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationDeliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`broadcastId` int,
	`bookingId` int,
	`recipientUserId` int,
	`notificationChannel` enum('in_app','push') NOT NULL,
	`notificationDeliveryStatus` enum('queued','sent','failed','disabled') NOT NULL DEFAULT 'queued',
	`payload` json NOT NULL,
	`providerMessageId` varchar(255),
	`errorCode` varchar(160),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificationDeliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pushDevices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` text NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`platform` varchar(32) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`disabledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushDevices_id` PRIMARY KEY(`id`),
	CONSTRAINT `pushDevices_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `refundRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`paymentId` int,
	`cancellationRequestId` int,
	`requestedByUserId` int,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`reason` text NOT NULL,
	`refundRequestStatus` enum('requested','reviewing','approved','rejected','processed','failed','cancelled') NOT NULL DEFAULT 'requested',
	`providerRefundId` varchar(160),
	`operatorNote` text,
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refundRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tripShareLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`title` varchar(180) NOT NULL,
	`message` varchar(320),
	`imageUrl` text,
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tripShareLinks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tripShareLinks_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE INDEX `booking_adjustment_booking_index` ON `bookingAdjustments` (`bookingId`,`bookingAdjustmentStatus`);--> statement-breakpoint
CREATE INDEX `booking_adjustment_invoice_index` ON `bookingAdjustments` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `booking_cancellation_booking_status_index` ON `bookingCancellationRequests` (`bookingId`,`bookingChangeStatus`);--> statement-breakpoint
CREATE INDEX `booking_cancellation_requested_index` ON `bookingCancellationRequests` (`requestedByUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `booking_extension_booking_status_index` ON `bookingExtensionRequests` (`bookingId`,`bookingChangeStatus`);--> statement-breakpoint
CREATE INDEX `booking_extension_requested_index` ON `bookingExtensionRequests` (`requestedByUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notification_delivery_recipient_index` ON `notificationDeliveries` (`recipientUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `notification_delivery_broadcast_index` ON `notificationDeliveries` (`broadcastId`,`notificationDeliveryStatus`);--> statement-breakpoint
CREATE INDEX `push_devices_user_enabled_index` ON `pushDevices` (`userId`,`isEnabled`);--> statement-breakpoint
CREATE INDEX `refund_request_booking_status_index` ON `refundRequests` (`bookingId`,`refundRequestStatus`);--> statement-breakpoint
CREATE INDEX `refund_request_payment_index` ON `refundRequests` (`paymentId`);--> statement-breakpoint
CREATE INDEX `trip_share_booking_index` ON `tripShareLinks` (`bookingId`,`expiresAt`);