-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDING';
