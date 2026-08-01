-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cleanPhone" TEXT NOT NULL,
    "email" TEXT,
    "driveUrl" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "details" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemStat" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SystemStat_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateId_key" ON "Certificate"("certificateId");

-- CreateIndex
CREATE INDEX "Certificate_cleanPhone_idx" ON "Certificate"("cleanPhone");

-- CreateIndex
CREATE INDEX "Certificate_phone_idx" ON "Certificate"("phone");

-- CreateIndex
CREATE INDEX "Certificate_email_idx" ON "Certificate"("email");