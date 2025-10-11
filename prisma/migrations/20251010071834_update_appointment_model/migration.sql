/*
  Warnings:

  - Added the required column `department` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_doctorId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT NOT NULL,
ALTER COLUMN "doctorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
