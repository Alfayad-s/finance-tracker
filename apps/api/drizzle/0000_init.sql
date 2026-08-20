-- Split groups only. Personal finance data is not stored here.
-- Safe to run more than once.

DO $$ BEGIN
  CREATE TYPE "member_role" AS ENUM ('owner', 'member');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "split_type" AS ENUM ('equal', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "groups" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "currency" text DEFAULT 'INR' NOT NULL,
  "invite_code" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "groups_invite_code_idx" ON "groups" ("invite_code");

CREATE TABLE IF NOT EXISTS "members" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
  "display_name" text NOT NULL,
  "role" "member_role" DEFAULT 'member' NOT NULL,
  "session_token_hash" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "members_session_token_hash_idx" ON "members" ("session_token_hash");
CREATE INDEX IF NOT EXISTS "members_group_id_idx" ON "members" ("group_id");

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
  "paid_by_member_id" text NOT NULL REFERENCES "members"("id") ON DELETE restrict,
  "amount_cents" integer NOT NULL,
  "note" text DEFAULT '' NOT NULL,
  "date" text NOT NULL,
  "split_type" "split_type" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "expenses_group_id_idx" ON "expenses" ("group_id");

CREATE TABLE IF NOT EXISTS "expense_shares" (
  "expense_id" text NOT NULL REFERENCES "expenses"("id") ON DELETE cascade,
  "member_id" text NOT NULL REFERENCES "members"("id") ON DELETE restrict,
  "share_cents" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "expense_shares_expense_member_idx" ON "expense_shares" ("expense_id", "member_id");

CREATE TABLE IF NOT EXISTS "settlements" (
  "id" text PRIMARY KEY NOT NULL,
  "group_id" text NOT NULL REFERENCES "groups"("id") ON DELETE cascade,
  "from_member_id" text NOT NULL REFERENCES "members"("id") ON DELETE restrict,
  "to_member_id" text NOT NULL REFERENCES "members"("id") ON DELETE restrict,
  "amount_cents" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "settlements_group_id_idx" ON "settlements" ("group_id");
