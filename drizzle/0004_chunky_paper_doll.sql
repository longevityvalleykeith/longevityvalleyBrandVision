CREATE TABLE `visionJobOutputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int NOT NULL,
	`colors_primary` text,
	`colors_secondary` text,
	`colors_description` text,
	`mood` varchar(255),
	`tone` varchar(255),
	`composition_layout` text,
	`brand_personality` text,
	`perceived_industry` varchar(255),
	`target_audience` text,
	`content_pieces` text,
	`isTrainingData` boolean NOT NULL DEFAULT true,
	`userRating` int,
	`userFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visionJobOutputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visionJobSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `visionJobSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `visionJobSessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `visionJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageContext` text,
	`analysisPurpose` text NOT NULL,
	`outputFormat` varchar(50) NOT NULL,
	`creativityLevel` decimal(2,1) NOT NULL DEFAULT '1.0',
	`additionalInstructions` text,
	`status` enum('pending','gemini_analyzing','deepseek_generating','complete','error') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`geminOutput` text,
	`deepseekOutput` text,
	`geminAnalyzedAt` timestamp,
	`deepseekGeneratedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`errorStage` varchar(50),
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visionJobs_id` PRIMARY KEY(`id`)
);
