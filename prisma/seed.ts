import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_USER_ID = process.env.TEST_USER_ID ?? "test-user-id-0000";

const DOMAINS = [
  { name: "Northwoods", color: "#2563eb", sortOrder: 0 },
  { name: "Scouts (Troop 79)", color: "#16a34a", sortOrder: 1 },
  { name: "Running Group (OMG)", color: "#ea580c", sortOrder: 2 },
  { name: "Family", color: "#9333ea", sortOrder: 3 },
  { name: "Personal Admin", color: "#0891b2", sortOrder: 4 },
  { name: "Finance / Investing", color: "#ca8a04", sortOrder: 5 },
  { name: "Property / Building", color: "#dc2626", sortOrder: 6 },
];

async function main() {
  // Upsert test user
  const user = await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      email: "test@focusos.dev",
      name: "Patrick (Test)",
    },
  });
  console.log(`✓ User: ${user.email}`);

  // Upsert UserSettings
  await prisma.userSettings.upsert({
    where: { userId: TEST_USER_ID },
    update: {},
    create: {
      userId: TEST_USER_ID,
      deepWorkEnabled: false,
      defaultAvailableMinutes: 240,
    },
  });
  console.log(`✓ UserSettings created`);

  // Create domains (skip if already exist)
  const domainRecords: Record<string, string> = {};
  for (const d of DOMAINS) {
    const domain = await prisma.domain.upsert({
      where: { userId_name: { userId: TEST_USER_ID, name: d.name } },
      update: {},
      create: {
        userId: TEST_USER_ID,
        name: d.name,
        color: d.color,
        sortOrder: d.sortOrder,
        status: "ACTIVE",
      },
    });
    domainRecords[d.name] = domain.id;
    console.log(`✓ Domain: ${domain.name}`);
  }

  // Create sample tasks so /today has something to show
  const northwoodsId = domainRecords["Northwoods"];
  const personalId = domainRecords["Personal Admin"];

  const tasks = [
    {
      userId: TEST_USER_ID,
      domainId: northwoodsId,
      title: "Review Northwoods site plan revisions",
      description: "Check updated blueprints from the architect",
      status: "NEXT",
      impact: 5,
      urgency: 4,
      strategicValue: 4,
      riskOfDelay: 3,
      isBlocker: true,
      effortMinutes: 45,
      energyRequired: "HIGH",
    },
    {
      userId: TEST_USER_ID,
      domainId: personalId,
      title: "File Q4 expense receipts",
      description: "Scan and upload to accounting software",
      status: "NEXT",
      impact: 3,
      urgency: 4,
      strategicValue: 1,
      riskOfDelay: 4,
      isBlocker: false,
      effortMinutes: 20,
      energyRequired: "LOW",
    },
    {
      userId: TEST_USER_ID,
      domainId: domainRecords["Scouts (Troop 79)"],
      title: "Plan merit badge schedule for spring campout",
      description: "Coordinate with merit badge counselors",
      status: "NEXT",
      impact: 4,
      urgency: 3,
      strategicValue: 3,
      riskOfDelay: 2,
      isBlocker: false,
      effortMinutes: 60,
      energyRequired: "MED",
    },
  ];

  for (const task of tasks) {
    // Check if already exists by title+userId
    const existing = await prisma.task.findFirst({
      where: { userId: TEST_USER_ID, title: task.title },
    });
    if (!existing) {
      await prisma.task.create({ data: task });
      console.log(`✓ Task: ${task.title}`);
    } else {
      console.log(`  (skip) Task already exists: ${task.title}`);
    }
  }

  console.log("\n✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
