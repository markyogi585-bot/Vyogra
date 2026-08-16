CREATE TABLE `bookingTripSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`source` varchar(48) NOT NULL DEFAULT 'operator_override',
	`updatedByUserId` int NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookingTripSchedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `bookingTripSchedules_bookingId_unique` UNIQUE(`bookingId`)
);
--> statement-breakpoint
CREATE INDEX `booking_trip_schedule_window_index` ON `bookingTripSchedules` (`startsAt`,`endsAt`);