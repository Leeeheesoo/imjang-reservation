import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({});

async function main() {
  const complexes = [
    { name: "동탄역 시범 우남 퍼스트빌", district: "화성시 동탄2동" },
    { name: "동탄 롯데캐슬", district: "화성시 동탄2동" },
    { name: "동탄 자이 파밀리에", district: "화성시 반송동" },
    { name: "동탄 센트럴 파크", district: "화성시 청계동" },
  ];

  for (const c of complexes) {
    const exists = await prisma.complex.findFirst({ where: { name: c.name } });
    if (!exists) {
      await prisma.complex.create({ data: c });
    }
  }

  console.log("Seed complete:", await prisma.complex.count(), "complexes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
