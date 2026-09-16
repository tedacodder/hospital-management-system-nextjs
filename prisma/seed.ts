import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

// Seeds the minimum a fresh deployment needs to be usable: the hospital
// settings row, a starting set of departments, and one administrator.
//
// It seeds NO patients, appointments, invoices or clinical records. Dashboards
// read real aggregates, so fabricated rows would show up as real activity.

const prisma = new PrismaClient();

const DEPARTMENTS = [
  ["General Medicine", "Primary consultations, triage and referrals"],
  ["Paediatrics", "Care for infants, children and adolescents"],
  ["Obstetrics & Gynaecology", "Maternal, reproductive and prenatal care"],
  ["Cardiology", "Heart and circulatory investigation and treatment"],
  ["Orthopaedics", "Bone, joint and musculoskeletal care"],
  ["Dermatology", "Skin, hair and nail conditions"],
  ["Ophthalmology", "Eye examination and treatment"],
  ["Emergency", "Urgent and unscheduled presentations"],
] as const;

async function main() {
  await prisma.hospitalSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });

  for (const [name, description] of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { name },
      create: { name, description },
      update: {},
    });
  }

  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Administrator ${email} already exists — leaving it alone.`);
  } else {
    // If no password is supplied, generate one and print it exactly once.
    const supplied = process.env.SEED_ADMIN_PASSWORD;
    const password = supplied || randomBytes(12).toString("base64url");

    await prisma.user.create({
      data: {
        name: "System Administrator",
        email,
        password: await bcrypt.hash(password, 12),
        role: Role.ADMIN,
      },
    });

    console.log(`\nCreated administrator: ${email}`);
    if (!supplied) {
      console.log(`Temporary password: ${password}`);
      console.log("Sign in and change it. This is the only time it is shown.\n");
    }
  }

  console.log(`Seeded ${DEPARTMENTS.length} departments.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
