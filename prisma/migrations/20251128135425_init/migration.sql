-- CreateEnum
CREATE TYPE "Role" AS ENUM ('manager', 'admin', 'mukhtar');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('high', 'mid', 'low');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('pending', 'accepted', 'refused');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "neighborhood" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "jti" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" BIGSERIAL NOT NULL,
    "submitterName" TEXT,
    "contactNumber" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "mukhtarInitialId" TEXT,
    "complaint_type" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'mid',
    "trackingTag" TEXT NOT NULL,
    "estimatedReviewTime" TEXT,
    "notes" TEXT,
    "solutionInfo" TEXT,
    "refusalReason" TEXT,
    "suggestedSolution" TEXT,
    "complaint_status" "Status" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_trackingTag_key" ON "complaints"("trackingTag");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_mukhtarInitialId_fkey" FOREIGN KEY ("mukhtarInitialId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
