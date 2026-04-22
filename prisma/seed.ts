/* eslint-disable no-console */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("Starting seed...");

  // 1. Countries
  await prisma.country.createMany({
    data: [
      { id: 1, name: "Timor-Leste", iso2: "TL", iso3: "TLS" },
      { id: 2, name: "Australia", iso2: "AU", iso3: "AUS" },
    ],
    skipDuplicates: true,
  });

  // 2. Cultures
  await prisma.culture.createMany({
    data: [
      { code: "en", name: "English" },
      { code: "tet", name: "Tetum" },
    ],
    skipDuplicates: true,
  });

  // 3. Localized Strings
  await prisma.localizedString.createMany({
    data: [
      {
        id: 1,
        cultureCode: "en",
        stringKey: "app.title",
        value: "TreeO2",
        context: "application",
      },
      {
        id: 2,
        cultureCode: "tet",
        stringKey: "app.title",
        value: "TreeO2",
        context: "application",
      },
      {
        id: 3,
        cultureCode: "en",
        stringKey: "report.status.completed",
        value: "Completed",
        context: "report",
      },
      {
        id: 4,
        cultureCode: "tet",
        stringKey: "report.status.completed",
        value: "Kompletu",
        context: "report",
      },
    ],
    skipDuplicates: true,
  });

  // 4. Roles
  await prisma.role.createMany({
    data: [
      { id: 1, name: "Admin" },
      { id: 2, name: "Manager" },
      { id: 3, name: "Inspector" },
      { id: 4, name: "Farmer" },
      { id: 5, name: "Developer" },
    ],
    skipDuplicates: true,
  });

  // 5. Partners
  await prisma.partner.createMany({
    data: [
      { id: 1, name: "xpand Foundation" },
      { id: 2, name: "Green Timor Initiative" },
    ],
    skipDuplicates: true,
  });

  // 6. Locations
  await prisma.location.createMany({
    data: [
      {
        id: 1,
        countryId: 1,
        parentId: null,
        level: 1,
        name: "Dili",
        code: "DIL",
        latitude: new Prisma.Decimal("-8.556900"),
        longitude: new Prisma.Decimal("125.560300"),
      },
      {
        id: 2,
        countryId: 1,
        parentId: 1,
        level: 2,
        name: "Cristo Rei",
        code: "CRI",
        latitude: new Prisma.Decimal("-8.540000"),
        longitude: new Prisma.Decimal("125.610000"),
      },
      {
        id: 3,
        countryId: 1,
        parentId: 2,
        level: 3,
        name: "Hera",
        code: "HER",
        latitude: new Prisma.Decimal("-8.533300"),
        longitude: new Prisma.Decimal("125.633300"),
      },
      {
        id: 4,
        countryId: 1,
        parentId: null,
        level: 1,
        name: "Baucau",
        code: "BAU",
        latitude: new Prisma.Decimal("-8.466700"),
        longitude: new Prisma.Decimal("126.450000"),
      },
    ],
    skipDuplicates: true,
  });

  // 7. Administrative Levels
  await prisma.administrativeLevel.createMany({
    data: [
      { id: 1, countryId: 1, level: 1, name: "Municipality" },
      { id: 2, countryId: 1, level: 2, name: "Administrative Post" },
      { id: 3, countryId: 1, level: 3, name: "Village" },
    ],
    skipDuplicates: true,
  });

  // 8. Tree Types
  await prisma.treeType.createMany({
    data: [
      {
        id: 1,
        name: "Mahogany",
        key: "mahogany",
        scientificName: "Swietenia macrophylla",
        dryWeightDensity: new Prisma.Decimal("595.000"),
      },
      {
        id: 2,
        name: "Teak",
        key: "teak",
        scientificName: "Tectona grandis",
        dryWeightDensity: new Prisma.Decimal("660.000"),
      },
      {
        id: 3,
        name: "Sandalwood",
        key: "sandalwood",
        scientificName: "Santalum album",
        dryWeightDensity: new Prisma.Decimal("870.000"),
      },
    ],
    skipDuplicates: true,
  });

  // 9. Projects
  await prisma.project.createMany({
    data: [
      {
        id: 1,
        name: "Hera Reforestation 2025",
        description: "Community-based tree restoration project in Hera.",
        countryId: 1,
        adminLocationId: 3,
        isActive: true,
      },
      {
        id: 2,
        name: "Baucau Agroforestry Pilot",
        description: "Agroforestry monitoring and survival tracking in Baucau.",
        countryId: 1,
        adminLocationId: 4,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // 10. Users
  const users = [
    {
      email: "admin@treeo2.local",
      passwordHash: "hashed_admin_pw",
      name: "TreeO2 Admin",
      roleId: 1,
      cardId: "CARD-ADM-001",
      governmentId: "GOV-ADM-001",
      gender: "Male",
      disability: false,
      countryId: 1,
      adminLocationId: 1,
      streetAddress: "Dili Central Office",
      preferredLanguage: "en",
      photoId: null,
      biography: "System administrator for TreeO2.",
      notes: "Primary admin account.",
      accountActive: true,
      dateJoined: new Date("2025-01-05T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
    {
      email: "manager@treeo2.local",
      passwordHash: "hashed_manager_pw",
      name: "Project Manager",
      roleId: 2,
      cardId: "CARD-MGR-001",
      governmentId: "GOV-MGR-001",
      gender: "Female",
      disability: false,
      countryId: 1,
      adminLocationId: 1,
      streetAddress: "Dili Operations",
      preferredLanguage: "en",
      photoId: null,
      biography: "Oversees project delivery and monitoring.",
      notes: "Assigned to multiple projects.",
      accountActive: true,
      dateJoined: new Date("2025-01-10T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
    {
      email: "inspector1@treeo2.local",
      passwordHash: "hashed_inspector1_pw",
      name: "Field Inspector One",
      roleId: 3,
      cardId: "CARD-INS-001",
      governmentId: "GOV-INS-001",
      gender: "Male",
      disability: false,
      countryId: 1,
      adminLocationId: 2,
      streetAddress: "Cristo Rei Field Office",
      preferredLanguage: "tet",
      photoId: null,
      biography: "Conducts on-site inspections.",
      notes: "Experienced in field validations.",
      accountActive: true,
      dateJoined: new Date("2025-01-12T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
    {
      email: "inspector2@treeo2.local",
      passwordHash: "hashed_inspector2_pw",
      name: "Field Inspector Two",
      roleId: 3,
      cardId: "CARD-INS-002",
      governmentId: "GOV-INS-002",
      gender: "Female",
      disability: false,
      countryId: 1,
      adminLocationId: 4,
      streetAddress: "Baucau Field Office",
      preferredLanguage: "tet",
      photoId: null,
      biography: "Supports rural inspection activities.",
      notes: "Assigned to Baucau pilot.",
      accountActive: true,
      dateJoined: new Date("2025-01-13T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
    {
      email: "farmer1@treeo2.local",
      passwordHash: "hashed_farmer1_pw",
      name: "Farmer One",
      roleId: 4,
      cardId: "CARD-FAR-001",
      governmentId: "GOV-FAR-001",
      gender: "Female",
      disability: false,
      countryId: 1,
      adminLocationId: 3,
      streetAddress: "Hera Village",
      preferredLanguage: "tet",
      photoId: null,
      biography: "Participating farmer in Hera region.",
      notes: "Linked to reforestation project.",
      accountActive: true,
      dateJoined: new Date("2025-01-15T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
    {
      email: "farmer2@treeo2.local",
      passwordHash: "hashed_farmer2_pw",
      name: "Farmer Two",
      roleId: 4,
      cardId: "CARD-FAR-002",
      governmentId: "GOV-FAR-002",
      gender: "Male",
      disability: false,
      countryId: 1,
      adminLocationId: 4,
      streetAddress: "Baucau Rural Area",
      preferredLanguage: "tet",
      photoId: null,
      biography: "Farmer involved in agroforestry activities.",
      notes: "Linked to Baucau pilot.",
      accountActive: true,
      dateJoined: new Date("2025-01-16T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
    {
      email: "developer@treeo2.local",
      passwordHash: "hashed_developer_pw",
      name: "Developer User",
      roleId: 5,
      cardId: "CARD-DEV-001",
      governmentId: "GOV-DEV-001",
      gender: "Male",
      disability: false,
      countryId: 2,
      adminLocationId: null,
      streetAddress: "Melbourne Support Hub",
      preferredLanguage: "en",
      photoId: null,
      biography: "Maintains the technical platform.",
      notes: "Support and development account.",
      accountActive: true,
      dateJoined: new Date("2025-01-18T00:00:00Z"),
      canSignIn: true,
      accessToken: null,
      accessTokenCreated: null,
      resetToken: null,
      resetTokenExpires: null,
    },
  ] as const;

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { ...user },
      create: { ...user },
    });
  }

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@treeo2.local" },
  });
  const manager = await prisma.user.findUniqueOrThrow({
    where: { email: "manager@treeo2.local" },
  });
  const inspector1 = await prisma.user.findUniqueOrThrow({
    where: { email: "inspector1@treeo2.local" },
  });
  const inspector2 = await prisma.user.findUniqueOrThrow({
    where: { email: "inspector2@treeo2.local" },
  });
  const farmer1 = await prisma.user.findUniqueOrThrow({
    where: { email: "farmer1@treeo2.local" },
  });
  const farmer2 = await prisma.user.findUniqueOrThrow({
    where: { email: "farmer2@treeo2.local" },
  });
  const developer = await prisma.user.findUniqueOrThrow({
    where: { email: "developer@treeo2.local" },
  });

  // 11. User Role Assignments
  await prisma.userRoleAssignment.createMany({
    data: [
      { userId: admin.id, roleId: 1 },
      { userId: manager.id, roleId: 2 },
      { userId: inspector1.id, roleId: 3 },
      { userId: inspector2.id, roleId: 3 },
      { userId: farmer1.id, roleId: 4 },
      { userId: farmer2.id, roleId: 4 },
      { userId: developer.id, roleId: 5 },
    ],
    skipDuplicates: true,
  });

  // 12. User Projects
  await prisma.userProject.createMany({
    data: [
      { userId: manager.id, projectId: 1 },
      { userId: manager.id, projectId: 2 },
      { userId: inspector1.id, projectId: 1 },
      { userId: inspector2.id, projectId: 2 },
      { userId: farmer1.id, projectId: 1 },
      { userId: farmer2.id, projectId: 2 },
    ],
    skipDuplicates: true,
  });

  // 13. Project Tree Types
  await prisma.projectTreeType.createMany({
    data: [
      { projectId: 1, treeTypeId: 1 },
      { projectId: 1, treeTypeId: 3 },
      { projectId: 2, treeTypeId: 2 },
    ],
    skipDuplicates: true,
  });

  // 14. Scan Batches
  await prisma.scanBatch.createMany({
    data: [
      {
        id: 1,
        inspectorId: inspector1.id,
        projectId: 1,
        uploadedAt: new Date("2025-02-01T09:00:00Z"),
      },
      {
        id: 2,
        inspectorId: inspector2.id,
        projectId: 2,
        uploadedAt: new Date("2025-02-10T11:30:00Z"),
      },
    ],
    skipDuplicates: true,
  });

  // 15. Tree Scans
  await prisma.treeScan.createMany({
    data: [
      {
        id: 1,
        fobId: "FOB-0001",
        projectId: 1,
        farmerId: farmer1.id,
        inspectorId: inspector1.id,
        speciesId: 1,
        estimatedPlantedYear: 2023,
        estimatedPlantedMonth: 6,
        plantedDate: new Date("2023-06-15T00:00:00Z"),
        heightM: new Prisma.Decimal("1.450"),
        circumferenceCm: new Prisma.Decimal("8.400"),
        diameterCm: new Prisma.Decimal("2.700"),
        latitude: -8.5331,
        longitude: 125.6331,
        photoId: null,
        batchId: 1,
        deviceId: "DEVICE-01",
        isArchived: false,
        isCorrected: false,
        correctedBy: null,
        correctionReason: null,
        isValid: true,
        validationNotes: "Healthy sapling observed.",
      },
      {
        id: 2,
        fobId: "FOB-0002",
        projectId: 1,
        farmerId: farmer1.id,
        inspectorId: inspector1.id,
        speciesId: 3,
        estimatedPlantedYear: 2022,
        estimatedPlantedMonth: 11,
        plantedDate: new Date("2022-11-20T00:00:00Z"),
        heightM: new Prisma.Decimal("0.950"),
        circumferenceCm: new Prisma.Decimal("5.600"),
        diameterCm: new Prisma.Decimal("1.800"),
        latitude: -8.5335,
        longitude: 125.6338,
        photoId: null,
        batchId: 1,
        deviceId: "DEVICE-01",
        isArchived: false,
        isCorrected: true,
        correctedBy: manager.id,
        correctionReason: "Corrected planting month after review.",
        isValid: true,
        validationNotes: "Data verified by manager.",
      },
      {
        id: 3,
        fobId: "FOB-0101",
        projectId: 2,
        farmerId: farmer2.id,
        inspectorId: inspector2.id,
        speciesId: 2,
        estimatedPlantedYear: 2024,
        estimatedPlantedMonth: 3,
        plantedDate: new Date("2024-03-05T00:00:00Z"),
        heightM: new Prisma.Decimal("1.800"),
        circumferenceCm: new Prisma.Decimal("10.200"),
        diameterCm: new Prisma.Decimal("3.100"),
        latitude: -8.4662,
        longitude: 126.4491,
        photoId: null,
        batchId: 2,
        deviceId: "DEVICE-02",
        isArchived: false,
        isCorrected: false,
        correctedBy: null,
        correctionReason: null,
        isValid: true,
        validationNotes: "Strong early growth.",
      },
    ],
    skipDuplicates: true,
  });

  // 16. Tree Scan Audit
  await prisma.treeScanAudit.createMany({
    data: [
      {
        id: 1,
        treeScanId: 2,
        changedBy: manager.id,
        changeReason: "Updated planting month",
        oldData: { estimatedPlantedMonth: 10 },
        newData: { estimatedPlantedMonth: 11 },
        changedAt: new Date("2025-02-02T12:00:00Z"),
      },
    ],
    skipDuplicates: true,
  });

  // 17. Adopters
  await prisma.adopter.createMany({
    data: [
      { id: 1, name: "Green Earth Donor", email: "donor1@example.com" },
      { id: 2, name: "Eco Supporter", email: "donor2@example.com" },
    ],
    skipDuplicates: true,
  });

  // 18. Adoptions
  await prisma.adoption.createMany({
    data: [
      {
        id: 1,
        adopterId: 1,
        fobId: "FOB-0001",
        adoptedAt: new Date("2025-02-15T00:00:00Z"),
      },
      {
        id: 2,
        adopterId: 2,
        fobId: "FOB-0101",
        adoptedAt: new Date("2025-02-20T00:00:00Z"),
      },
    ],
    skipDuplicates: true,
  });

  // 19. Reports
  await prisma.report.createMany({
    data: [
      {
        id: 1,
        reportType: "Tree Survival Summary",
        requestedBy: manager.id,
        status: "COMPLETED",
        parameters: { projectId: 1, month: "2025-02" },
        outputUrl: "https://xyz.com/reports/tree-survival-summary.pdf",
        completedAt: new Date("2025-02-28T10:00:00Z"),
      },
      {
        id: 2,
        reportType: "Inspector Activity Report",
        requestedBy: admin.id,
        status: "PENDING",
        parameters: { inspectorId: inspector1.id },
        outputUrl: null,
        completedAt: null,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed completed successfully.");
}

void main()
  .catch((err: unknown) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });