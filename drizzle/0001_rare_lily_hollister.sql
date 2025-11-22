CREATE TABLE `brandAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandId` int NOT NULL,
	`assetType` enum('photo','video') NOT NULL,
	`storageUrl` text NOT NULL,
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brandAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandInputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productInfo` text NOT NULL,
	`sellingPoints` text NOT NULL,
	`targetAudience` text,
	`painPoints` text,
	`scenarios` text,
	`ctaOffer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brandInputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brandName` varchar(255) NOT NULL,
	`logoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`brandId` int,
	`messageLog` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `generatedContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inputId` int NOT NULL,
	`userId` int NOT NULL,
	`storyboardMandarin` text NOT NULL,
	`captionMandarin` text NOT NULL,
	`explanationEnglish` text NOT NULL,
	`userFeedbackScore` int,
	`userFeedbackText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `generatedContent_id` PRIMARY KEY(`id`)
);
