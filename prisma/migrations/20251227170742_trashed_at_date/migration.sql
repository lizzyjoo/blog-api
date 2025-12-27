/*
  Warnings:

  - You are about to drop the column `trash` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "trash",
ADD COLUMN     "trashedAt" TIMESTAMP(3);
