import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Budget hierarchy from the org's actual spec (amounts are placeholders —
// adjust to real numbers from /admin/budgets once the app is running).
// Yale lectureship funds used to recoup guest speaker costs — external
// university money, reviewed on direct application, not the org's own budget.
const LECTURESHIPS: {
  name: string;
  purpose: string;
  contact: string;
  isCommonlyUsed: boolean;
}[] = [
  {
    name: "Isaac H. Bromley Lectureship",
    purpose: "Lectures by people of distinction on subjects connected with journalism, literature, or public affairs.",
    contact: "Ryan Croteau, Associate Director of University Events",
    isCommonlyUsed: true,
  },
  {
    name: "Daniel S. Lamont Memorial Lectureship",
    purpose: "Lectures on English letter writing or on government.",
    contact: "Ryan Croteau, Associate Director of University Events",
    isCommonlyUsed: true,
  },
  {
    name: "Harvard Lectureship",
    purpose: "Lectures by current or former Harvard students, or Harvard faculty.",
    contact: "Ryan Croteau, Associate Director of University Events",
    isCommonlyUsed: true,
  },
  {
    name: "Charles Gallaudet Trumbull Lectureship",
    purpose: "Lectures on any topic.",
    contact: "Ryan Croteau, Associate Director of University Events",
    isCommonlyUsed: true,
  },
  {
    name: "Frank Austin Gooch Lectureship",
    purpose: "An annual lecture to be delivered on Professor Gooch's birthday, May 2.",
    contact: "Ryan Croteau, Associate Director of University Events",
    isCommonlyUsed: false,
  },
  {
    name: "John Hersey Lectureship",
    purpose: "Lectures to honor John Hersey.",
    contact: "the Center for Teaching and Learning",
    isCommonlyUsed: false,
  },
  {
    name: "Edward H. Hume Memorial Lectureship",
    purpose:
      'Lectures related to "the contribution of the Chinese people to civilization in the creative arts, science, or philosophy."',
    contact: "the Council on East Asian Studies",
    isCommonlyUsed: false,
  },
];

const BUDGET_HIERARCHY: Record<string, Record<string, number>> = {
  "Guest Expenses": {
    "Debate Travel": 4000,
    "Debate Dinner": 1500,
    Accommodation: 2500,
  },
  "Union Social Life": {
    Toastings: 800,
    "Party Grants": 2000,
  },
  "Paper Publicity": {
    Posters: 600,
    "Weekly Newsletter": 400,
  },
};

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "por" },
    update: {},
    create: {
      name: "Yale Political Union of the Party of the Right",
      slug: "por",
    },
  });

  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { orgId_label: { orgId: org.id, label: "2026-2027" } },
    update: {},
    create: {
      orgId: org.id,
      label: "2026-2027",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2027-06-30"),
    },
  });

  for (const [areaName, items] of Object.entries(BUDGET_HIERARCHY)) {
    const area = await prisma.budgetArea.upsert({
      where: { fiscalYearId_name: { fiscalYearId: fiscalYear.id, name: areaName } },
      update: {},
      create: {
        orgId: org.id,
        fiscalYearId: fiscalYear.id,
        name: areaName,
      },
    });

    for (const [itemName, budgetedAmount] of Object.entries(items)) {
      await prisma.budgetItem.upsert({
        where: { budgetAreaId_name: { budgetAreaId: area.id, name: itemName } },
        update: {},
        create: {
          budgetAreaId: area.id,
          name: itemName,
          budgetedAmount,
        },
      });
    }
  }

  for (const fund of LECTURESHIPS) {
    await prisma.lectureshipFund.upsert({
      where: { orgId_name: { orgId: org.id, name: fund.name } },
      update: { purpose: fund.purpose, contact: fund.contact, isCommonlyUsed: fund.isCommonlyUsed },
      create: {
        orgId: org.id,
        name: fund.name,
        purpose: fund.purpose,
        contact: fund.contact,
        isCommonlyUsed: fund.isCommonlyUsed,
      },
    });
  }

  console.log(`Seeded org "${org.name}" (${org.slug}) with fiscal year ${fiscalYear.label}.`);
  console.log(
    "No reimbursement cycles were seeded — cycles reference a treasurer User, and User rows " +
      "only exist once someone signs in via Google. Log in first (the BOOTSTRAP_SUPER_ADMIN_EMAIL " +
      "account becomes SUPER_ADMIN automatically), then create cycles at /admin/cycles.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
