CREATE TABLE IF NOT EXISTS "CouncilResponse" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"modelId" varchar NOT NULL,
	"responseText" text NOT NULL,
	"ttft" integer,
	"duration" integer,
	"tokenCount" integer,
	"userVote" varchar,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CouncilSession" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chatId" uuid NOT NULL,
	"mode" varchar NOT NULL,
	"selectedModels" json NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "CouncilSynthesis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionId" uuid NOT NULL,
	"messageId" uuid NOT NULL,
	"synthesisText" text NOT NULL,
	"synthesiserModel" varchar NOT NULL,
	"contributingModels" json NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CouncilResponse" ADD CONSTRAINT "CouncilResponse_sessionId_CouncilSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."CouncilSession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CouncilResponse" ADD CONSTRAINT "CouncilResponse_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CouncilSession" ADD CONSTRAINT "CouncilSession_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CouncilSynthesis" ADD CONSTRAINT "CouncilSynthesis_sessionId_CouncilSession_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."CouncilSession"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "CouncilSynthesis" ADD CONSTRAINT "CouncilSynthesis_messageId_Message_v2_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message_v2"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
