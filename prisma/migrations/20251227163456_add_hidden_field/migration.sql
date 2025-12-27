/*
  Warnings:

  - You are about to drop the column `viewable` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "viewable",
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trash" BOOLEAN NOT NULL DEFAULT false;
