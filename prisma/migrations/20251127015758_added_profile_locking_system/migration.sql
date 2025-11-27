/*
  Warnings:

  - You are about to alter the column `firstName` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `lastName` on the `UserProfile` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "addressApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "addressLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "addressPending" TEXT,
ADD COLUMN     "changeRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstNameApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstNameLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstNamePending" VARCHAR(100),
ADD COLUMN     "lastNameApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastNameLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastNamePending" VARCHAR(100),
ADD COLUMN     "phoneApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phonePending" TEXT,
ADD COLUMN     "workPlace" TEXT,
ADD COLUMN     "workPlaceApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workPlaceLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workPlacePending" TEXT,
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(100);
