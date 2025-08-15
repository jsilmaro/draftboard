-- AlterTable
ALTER TABLE "public"."Brief" ADD COLUMN     "winnersSelected" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Winner" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rewardId" TEXT,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WinnerReward" (
    "id" TEXT NOT NULL,
    "briefId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "cashAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "creditAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prizeDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WinnerReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Winner_submissionId_key" ON "public"."Winner"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Winner_rewardId_key" ON "public"."Winner"("rewardId");

-- AddForeignKey
ALTER TABLE "public"."Winner" ADD CONSTRAINT "Winner_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "public"."Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Winner" ADD CONSTRAINT "Winner_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Winner" ADD CONSTRAINT "Winner_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Winner" ADD CONSTRAINT "Winner_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."WinnerReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WinnerReward" ADD CONSTRAINT "WinnerReward_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "public"."Brief"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
