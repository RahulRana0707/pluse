-- CreateTable
CREATE TABLE "x_connection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "xUserId" TEXT,
    "username" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "x_connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "x_connection_userId_key" ON "x_connection"("userId");

-- AddForeignKey
ALTER TABLE "x_connection" ADD CONSTRAINT "x_connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
