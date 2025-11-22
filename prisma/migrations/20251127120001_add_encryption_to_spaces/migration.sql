-- AddEncryptionFieldsToSpaces
ALTER TABLE "spaces" ADD COLUMN     "is_encrypted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "spaces" ADD COLUMN     "password_hash" TEXT;