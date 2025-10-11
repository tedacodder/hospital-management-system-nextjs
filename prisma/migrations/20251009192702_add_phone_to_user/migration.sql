/*
  Warnings:

  - The primary key for the `Appointment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Doctor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Doctor` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `MedicalRecord` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `MedicalRecord` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Patient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Patient` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `patientId` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `doctorId` on the `Appointment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Doctor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `patientId` on the `MedicalRecord` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Patient` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_patientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Doctor" DROP CONSTRAINT "Doctor_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MedicalRecord" DROP CONSTRAINT "MedicalRecord_patientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Patient" DROP CONSTRAINT "Patient_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Appointment" DROP CONSTRAINT "Appointment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "patientId",
ADD COLUMN     "patientId" INTEGER NOT NULL,
DROP COLUMN "doctorId",
ADD COLUMN     "doctorId" INTEGER NOT NULL,
ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Doctor" DROP CONSTRAINT "Doctor_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."MedicalRecord" DROP CONSTRAINT "MedicalRecord_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "patientId",
ADD COLUMN     "patientId" INTEGER NOT NULL,
ADD CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Patient" DROP CONSTRAINT "Patient_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Patient_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "age" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phone" TEXT NOT NULL DEFAULT '',
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "public"."Doctor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_userId_key" ON "public"."Patient"("userId");

-- AddForeignKey
ALTER TABLE "public"."Patient" ADD CONSTRAINT "Patient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
