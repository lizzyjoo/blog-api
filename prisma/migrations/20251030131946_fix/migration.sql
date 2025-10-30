/*
  Warnings:

  - You are about to drop the column `viweable` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "viweable",
ADD COLUMN     "viewable" BOOLEAN NOT NULL DEFAULT true;
