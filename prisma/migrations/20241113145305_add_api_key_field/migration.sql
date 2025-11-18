-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AlterTable
ALTER TABLE "system_configs" ADD COLUMN     "api_key" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_api_key_key" ON "system_configs"("api_key");