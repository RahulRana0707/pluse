-- CreateTable
CREATE TABLE "post_performance" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "views" INTEGER,
    "likes" INTEGER,
    "replies" INTEGER,
    "reposts" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_performance_draftId_recordedAt_idx" ON "post_performance"("draftId", "recordedAt" DESC);

-- AddForeignKey
ALTER TABLE "post_performance" ADD CONSTRAINT "post_performance_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "draft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
