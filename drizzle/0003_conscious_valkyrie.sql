CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`keyPrefix` varchar(8) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`permissions` enum('read','write','admin') NOT NULL DEFAULT 'read',
	`isActive` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_keyHash_unique` UNIQUE(`keyHash`)
);
