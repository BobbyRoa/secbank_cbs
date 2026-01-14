CREATE TABLE `instapayTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceNumber` varchar(20) NOT NULL,
	`switchReferenceNumber` varchar(50),
	`sourceAccountId` int NOT NULL,
	`sourceAccountNumber` varchar(10) NOT NULL,
	`bankName` varchar(100) NOT NULL,
	`bankCode` varchar(20) NOT NULL,
	`accountNumber` varchar(50) NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`status` enum('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
	`statusMessage` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `instapayTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `instapayTransactions_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
