import { PrismaClient, Role, SeatStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SEAT_ROWS, SEATS_PER_ROW } from "@cinema/shared";

const prisma = new PrismaClient();

async function main() {
  const seats = SEAT_ROWS.flatMap((row) =>
    Array.from({ length: SEATS_PER_ROW }, (_, i) => {
      const label = `${row}${i + 1}`;
      return {
        label,
        status: SeatStatus.AVAILABLE,
      };
    }),
  );

  for (const seat of seats) {
    await prisma.seat.upsert({
      where: { label: seat.label },
      update: {},
      create: seat,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@cinema.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // Demo user for local testing
  const demoHash = await bcrypt.hash("User1234!", 10);
  await prisma.user.upsert({
    where: { email: "user@cinema.local" },
    update: { passwordHash: demoHash },
    create: {
      email: "user@cinema.local",
      passwordHash: demoHash,
      role: Role.USER,
    },
  });

  console.log(`Seeded ${seats.length} seats, admin ${adminEmail}, user@cinema.local`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
