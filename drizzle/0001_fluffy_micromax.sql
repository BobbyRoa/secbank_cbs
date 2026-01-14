CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`branchCode` varchar(3) NOT NULL,
	`accountNumber` varchar(10) NOT NULL,
	`balance` decimal(18,2) NOT NULL DEFAULT '0.00',
	`productType` varchar(50) NOT NULL DEFAULT 'REGULAR_SAVING',
	`status` enum('active','closed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_accountNumber_unique` UNIQUE(`accountNumber`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(3) NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `branches_id` PRIMARY KEY(`id`),
	CONSTRAINT `branches_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactionSequence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(8) NOT NULL,
	`lastSequence` int NOT NULL DEFAULT 0,
	CONSTRAINT `transactionSequence_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactionSequence_date_unique` UNIQUE(`date`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referenceNumber` varchar(20) NOT NULL,
	`accountId` int NOT NULL,
	`type` enum('DEPOSIT','WITHDRAWAL','INTERNAL_TRANSFER','INSTAPAY') NOT NULL,
	`amount` decimal(18,2) NOT NULL,
	`balanceAfter` decimal(18,2) NOT NULL,
	`relatedAccountId` int,
	`relatedAccountNumber` varchar(20),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
