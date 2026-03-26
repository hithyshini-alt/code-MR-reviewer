-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gitlab_pat_encrypted" TEXT,
    "ai_api_key_encrypted" TEXT,
    "gitlab_base_url" TEXT NOT NULL DEFAULT 'https://gitlab.com',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'regex',
    "pattern" TEXT,
    "comment" TEXT NOT NULL,
    "category" TEXT,
    "suggestion" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_builtin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_runs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mr_url" TEXT NOT NULL,
    "mr_title" TEXT,
    "project_id" TEXT,
    "mr_iid" TEXT,
    "files_reviewed" INTEGER NOT NULL DEFAULT 0,
    "files_excluded" INTEGER NOT NULL DEFAULT 0,
    "total_findings" INTEGER NOT NULL DEFAULT 0,
    "include_test_files" BOOLEAN NOT NULL DEFAULT false,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "file_path" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "code_snippet" TEXT,
    "severity" TEXT NOT NULL,
    "ai_suggestion" TEXT,
    "comment_posted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posted_comments" (
    "id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "finding_id" TEXT NOT NULL,
    "gitlab_note_id" TEXT,
    "dedup_marker" TEXT NOT NULL,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posted_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_user_id_key" ON "user_credentials"("user_id");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_runs" ADD CONSTRAINT "review_runs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "review_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posted_comments" ADD CONSTRAINT "posted_comments_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "review_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posted_comments" ADD CONSTRAINT "posted_comments_finding_id_fkey" FOREIGN KEY ("finding_id") REFERENCES "findings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
