import { PrismaClient, Prisma } from "@prisma/client";

import { hashPassword } from "../src/lib/bcrypt";

const prisma = new PrismaClient();

type Tx = Prisma.TransactionClient;

type RoleName = "Farmer" | "Inspector" | "Manager" | "Admin" | "Developer";

type UserSeed = {
  email: string;
  passwordHash: string;
  name: string;
  roleName: RoleName;
  cardId: string;
  governmentId: string;
  gender: string;
  disability: boolean;
  countryIso2: "TL" | "AU";
  adminLocationCode: "DIL" | "CRI" | "HER" | "BAU" | null;
  streetAddress: string;
  preferredLanguage: string;
  biography: string;
  notes: string;
  accountActive: boolean;
  dateJoined: Date;
};

function getSingleOrThrow<T>(rows: T[], message: string): T | null {
  if (rows.length > 1) {
    throw new Error(message);
  }

  return rows[0] ?? null;
}

async function upsertCountry(
  tx: Tx,
  data: { name: string; iso2: string; iso3: string },
) {
  return tx.country.upsert({
    where: { iso2: data.iso2 },
    update: data,
    create: data,
  });
}

async function upsertCulture(tx: Tx, data: { code: string; name: string }) {
  return tx.culture.upsert({
    where: { code: data.code },
    update: data,
    create: data,
  });
}

async function upsertLocalizedString(
  tx: Tx,
  data: {
    cultureCode: string;
    stringKey: string;
    value: string;
    context: string;
  },
) {
  return tx.localizedString.upsert({
    where: {
      cultureCode_stringKey_context: {
        cultureCode: data.cultureCode,
        stringKey: data.stringKey,
        context: data.context,
      },
    },
    update: { value: data.value },
    create: data,
  });
}

async function upsertRole(tx: Tx, name: string) {
  return tx.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function upsertPartner(tx: Tx, name: string) {
  const existing = getSingleOrThrow(
    await tx.partner.findMany({ where: { name } }),
    `Cannot seed Partner deterministically. Multiple rows found for name: ${name}`,
  );

  if (existing) {
    return tx.partner.update({
      where: { id: existing.id },
      data: { name },
    });
  }

  return tx.partner.create({ data: { name } });
}

async function upsertLocation(
  tx: Tx,
  data: {
    countryId: number;
    parentId: number | null;
    level: number;
    name: string;
    code: string | null;
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
  },
) {
  const existing = getSingleOrThrow(
    await tx.location.findMany({
      where: {
        countryId: data.countryId,
        code: data.code,
      },
    }),
    `Cannot seed Location deterministically. Multiple rows found for countryId=${data.countryId} and code=${String(data.code)}`,
  );

  if (existing) {
    return tx.location.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.location.create({ data });
}

async function upsertAdministrativeLevel(
  tx: Tx,
  data: { countryId: number; level: number; name: string },
) {
  const existing = getSingleOrThrow(
    await tx.administrativeLevel.findMany({
      where: {
        countryId: data.countryId,
        level: data.level,
      },
    }),
    `Cannot seed AdministrativeLevel deterministically. Multiple rows found for countryId=${data.countryId} and level=${data.level}`,
  );

  if (existing) {
    return tx.administrativeLevel.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.administrativeLevel.create({ data });
}

async function upsertTreeType(
  tx: Tx,
  data: {
    name: string;
    key: string;
    scientificName: string;
    dryWeightDensity: Prisma.Decimal;
  },
) {
  const existing = getSingleOrThrow(
    await tx.treeType.findMany({
      where: { key: data.key },
    }),
    `Cannot seed TreeType deterministically. Multiple rows found for key: ${data.key}`,
  );

  if (existing) {
    return tx.treeType.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.treeType.create({ data });
}

async function upsertProject(
  tx: Tx,
  data: {
    name: string;
    description: string;
    countryId: number;
    adminLocationId: number;
    isActive: boolean;
  },
) {
  const existing = getSingleOrThrow(
    await tx.project.findMany({
      where: { name: data.name },
    }),
    `Cannot seed Project deterministically. Multiple rows found for name: ${data.name}`,
  );

  if (existing) {
    return tx.project.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.project.create({ data });
}

async function upsertUser(
  tx: Tx,
  data: {
    email: string;
    passwordHash: string;
    name: string;
    roleId: number;
    cardId: string;
    governmentId: string;
    gender: string;
    disability: boolean;
    countryId: number;
    adminLocationId: number | null;
    streetAddress: string;
    preferredLanguage: string;
    photoId: null;
    biography: string;
    notes: string;
    accountActive: boolean;
    dateJoined: Date;
    canSignIn: boolean;
    accessToken: null;
    accessTokenCreated: null;
    resetToken: null;
    resetTokenExpires: null;
  },
) {
  const updateData = {
    passwordHash: data.passwordHash,
    name: data.name,
    roleId: data.roleId,
    cardId: data.cardId,
    governmentId: data.governmentId,
    gender: data.gender,
    disability: data.disability,
    countryId: data.countryId,
    adminLocationId: data.adminLocationId,
    streetAddress: data.streetAddress,
    preferredLanguage: data.preferredLanguage,
    photoId: data.photoId,
    biography: data.biography,
    notes: data.notes,
    accountActive: data.accountActive,
    dateJoined: data.dateJoined,
    canSignIn: data.canSignIn,
  };

  return tx.user.upsert({
    where: { email: data.email },
    update: updateData,
    create: data,
  });
}

async function upsertScanBatch(
  tx: Tx,
  data: { inspectorId: number; projectId: number; uploadedAt: Date },
) {
  const existing = getSingleOrThrow(
    await tx.scanBatch.findMany({
      where: {
        inspectorId: data.inspectorId,
        projectId: data.projectId,
        uploadedAt: data.uploadedAt,
      },
    }),
    `Cannot seed ScanBatch deterministically. Multiple rows found for inspectorId=${data.inspectorId}, projectId=${data.projectId}, uploadedAt=${data.uploadedAt.toISOString()}`,
  );

  if (existing) {
    return tx.scanBatch.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.scanBatch.create({ data });
}

async function upsertTreeScan(
  tx: Tx,
  data: {
    fobId: string;
    projectId: number;
    farmerId: number;
    inspectorId: number;
    speciesId: number;
    estimatedPlantedYear: number;
    estimatedPlantedMonth: number;
    plantedDate: Date;
    heightM: Prisma.Decimal;
    circumferenceCm: Prisma.Decimal;
    diameterCm: Prisma.Decimal;
    latitude: number;
    longitude: number;
    photoId: null;
    batchId: number;
    deviceId: string;
    isArchived: boolean;
    isCorrected: boolean;
    correctedBy: number | null;
    correctionReason: string | null;
    isValid: boolean;
    validationNotes: string;
  },
) {
  const existingRows = await tx.treeScan.findMany({
    where: { fobId: data.fobId },
  });

  const existing = getSingleOrThrow(
    existingRows,
    `Cannot seed TreeScan deterministically. Multiple rows found for fobId: ${data.fobId}`,
  );

  if (existing) {
    return tx.treeScan.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.treeScan.create({ data });
}

async function upsertTreeScanAudit(
  tx: Tx,
  data: {
    treeScanId: number;
    changedBy: number;
    changeReason: string;
    oldData: Prisma.InputJsonValue;
    newData: Prisma.InputJsonValue;
    changedAt: Date;
  },
) {
  const existing = getSingleOrThrow(
    await tx.treeScanAudit.findMany({
      where: {
        treeScanId: data.treeScanId,
        changedBy: data.changedBy,
        changedAt: data.changedAt,
      },
    }),
    `Cannot seed TreeScanAudit deterministically. Multiple rows found for treeScanId=${data.treeScanId}, changedBy=${data.changedBy}, changedAt=${data.changedAt.toISOString()}`,
  );

  if (existing) {
    return tx.treeScanAudit.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.treeScanAudit.create({ data });
}

async function upsertAdopter(tx: Tx, data: { name: string; email: string }) {
  const existing = getSingleOrThrow(
    await tx.adopter.findMany({
      where: { email: data.email },
    }),
    `Cannot seed Adopter deterministically. Multiple rows found for email: ${data.email}`,
  );

  if (existing) {
    return tx.adopter.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.adopter.create({ data });
}

async function upsertAdoption(
  tx: Tx,
  data: { adopterId: number; fobId: string; adoptedAt: Date },
) {
  const existing = getSingleOrThrow(
    await tx.adoption.findMany({
      where: {
        adopterId: data.adopterId,
        fobId: data.fobId,
      },
    }),
    `Cannot seed Adoption deterministically. Multiple rows found for adopterId=${data.adopterId} and fobId=${data.fobId}`,
  );

  if (existing) {
    return tx.adoption.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.adoption.create({ data });
}

async function upsertReport(
  tx: Tx,
  data: {
    reportType: string;
    requestedBy: number;
    status: "PENDING" | "PROCESSING" | "COMPLETE" | "FAILED";
    parameters: Prisma.InputJsonValue;
    outputUrl: string | null;
    completedAt: Date | null;
  },
) {
  const existing = getSingleOrThrow(
    await tx.report.findMany({
      where: {
        reportType: data.reportType,
        requestedBy: data.requestedBy,
      },
    }),
    `Cannot seed Report deterministically. Multiple rows found for reportType=${data.reportType} and requestedBy=${data.requestedBy}`,
  );

  if (existing) {
    return tx.report.update({
      where: { id: existing.id },
      data,
    });
  }

  return tx.report.create({ data });
}

async function main(): Promise<void> {
  console.log("Starting seed...");

  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed script must not be run in production.");
  }

  if (process.env.ALLOW_SAMPLE_SEED !== "true") {
    throw new Error("Set ALLOW_SAMPLE_SEED=true to run the sample seed script.");
  }

  const passwordHashes = {
    admin: await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? "Admin@123"),
    manager: await hashPassword(
      process.env.SEED_MANAGER_PASSWORD ?? "Manager@123",
    ),
    inspector1: await hashPassword(
      process.env.SEED_INSPECTOR1_PASSWORD ?? "Inspector1@123",
    ),
    inspector2: await hashPassword(
      process.env.SEED_INSPECTOR2_PASSWORD ?? "Inspector2@123",
    ),
    farmer1: await hashPassword(
      process.env.SEED_FARMER1_PASSWORD ?? "Farmer1@123",
    ),
    farmer2: await hashPassword(
      process.env.SEED_FARMER2_PASSWORD ?? "Farmer2@123",
    ),
    developer: await hashPassword(
      process.env.SEED_DEVELOPER_PASSWORD ?? "Developer@123",
    ),
  };

  await prisma.$transaction(async (tx) => {
    const timorLeste = await upsertCountry(tx, {
      name: "Timor-Leste",
      iso2: "TL",
      iso3: "TLS",
    });

    const australia = await upsertCountry(tx, {
      name: "Australia",
      iso2: "AU",
      iso3: "AUS",
    });

    await upsertCulture(tx, { code: "en", name: "English" });
    await upsertCulture(tx, { code: "tet", name: "Tetum" });

    await upsertLocalizedString(tx, {
      cultureCode: "en",
      stringKey: "app.title",
      value: "TreeO2",
      context: "application",
    });

    await upsertLocalizedString(tx, {
      cultureCode: "tet",
      stringKey: "app.title",
      value: "TreeO2",
      context: "application",
    });

    await upsertLocalizedString(tx, {
      cultureCode: "en",
      stringKey: "report.status.complete",
      value: "Complete",
      context: "report",
    });

    await upsertLocalizedString(tx, {
      cultureCode: "tet",
      stringKey: "report.status.complete",
      value: "Kompletu",
      context: "report",
    });

    await upsertRole(tx, "Farmer");
    await upsertRole(tx, "Inspector");
    await upsertRole(tx, "Manager");
    await upsertRole(tx, "Admin");
    await upsertRole(tx, "Developer");

    await upsertPartner(tx, "xpand Foundation");
    await upsertPartner(tx, "Green Timor Initiative");

    const dili = await upsertLocation(tx, {
      countryId: timorLeste.id,
      parentId: null,
      level: 1,
      name: "Dili",
      code: "DIL",
      latitude: new Prisma.Decimal("-8.556900"),
      longitude: new Prisma.Decimal("125.560300"),
    });

    const cristoRei = await upsertLocation(tx, {
      countryId: timorLeste.id,
      parentId: dili.id,
      level: 2,
      name: "Cristo Rei",
      code: "CRI",
      latitude: new Prisma.Decimal("-8.540000"),
      longitude: new Prisma.Decimal("125.610000"),
    });

    const hera = await upsertLocation(tx, {
      countryId: timorLeste.id,
      parentId: cristoRei.id,
      level: 3,
      name: "Hera",
      code: "HER",
      latitude: new Prisma.Decimal("-8.533300"),
      longitude: new Prisma.Decimal("125.633300"),
    });

    const baucau = await upsertLocation(tx, {
      countryId: timorLeste.id,
      parentId: null,
      level: 1,
      name: "Baucau",
      code: "BAU",
      latitude: new Prisma.Decimal("-8.466700"),
      longitude: new Prisma.Decimal("126.450000"),
    });

    await upsertAdministrativeLevel(tx, {
      countryId: timorLeste.id,
      level: 1,
      name: "Municipality",
    });

    await upsertAdministrativeLevel(tx, {
      countryId: timorLeste.id,
      level: 2,
      name: "Administrative Post",
    });

    await upsertAdministrativeLevel(tx, {
      countryId: timorLeste.id,
      level: 3,
      name: "Village",
    });

    const mahogany = await upsertTreeType(tx, {
      name: "Mahogany",
      key: "mahogany",
      scientificName: "Swietenia macrophylla",
      dryWeightDensity: new Prisma.Decimal("595.000"),
    });

    const teak = await upsertTreeType(tx, {
      name: "Teak",
      key: "teak",
      scientificName: "Tectona grandis",
      dryWeightDensity: new Prisma.Decimal("660.000"),
    });

    const sandalwood = await upsertTreeType(tx, {
      name: "Sandalwood",
      key: "sandalwood",
      scientificName: "Santalum album",
      dryWeightDensity: new Prisma.Decimal("870.000"),
    });

    const heraProject = await upsertProject(tx, {
      name: "Hera Reforestation 2025",
      description: "Community-based tree restoration project in Hera.",
      countryId: timorLeste.id,
      adminLocationId: hera.id,
      isActive: true,
    });

    const baucauProject = await upsertProject(tx, {
      name: "Baucau Agroforestry Pilot",
      description: "Agroforestry monitoring and survival tracking in Baucau.",
      countryId: timorLeste.id,
      adminLocationId: baucau.id,
      isActive: true,
    });

    const roles = {
      farmer: await tx.role.findUniqueOrThrow({ where: { name: "Farmer" } }),
      inspector: await tx.role.findUniqueOrThrow({
        where: { name: "Inspector" },
      }),
      manager: await tx.role.findUniqueOrThrow({ where: { name: "Manager" } }),
      admin: await tx.role.findUniqueOrThrow({ where: { name: "Admin" } }),
      developer: await tx.role.findUniqueOrThrow({
        where: { name: "Developer" },
      }),
    };

    const expectedRoleIds: Record<RoleName, number> = {
      Farmer: 1,
      Inspector: 2,
      Manager: 3,
      Admin: 4,
      Developer: 5,
    };

    const actualRoleIds: Record<RoleName, number> = {
      Farmer: roles.farmer.id,
      Inspector: roles.inspector.id,
      Manager: roles.manager.id,
      Admin: roles.admin.id,
      Developer: roles.developer.id,
    };

    for (const roleName of Object.keys(expectedRoleIds) as RoleName[]) {
      if (actualRoleIds[roleName] !== expectedRoleIds[roleName]) {
        throw new Error(
          `Role ID mismatch for ${roleName}. Expected ${expectedRoleIds[roleName]}, found ${actualRoleIds[roleName]}. Reset the local database and rerun migrations before seeding.`,
        );
      }
    }

    const locationIdsByCode = {
      DIL: dili.id,
      CRI: cristoRei.id,
      HER: hera.id,
      BAU: baucau.id,
    } as const;

    const countryIdsByIso2 = {
      TL: timorLeste.id,
      AU: australia.id,
    } as const;

    const roleIdsByName: Record<RoleName, number> = {
      Farmer: roles.farmer.id,
      Inspector: roles.inspector.id,
      Manager: roles.manager.id,
      Admin: roles.admin.id,
      Developer: roles.developer.id,
    };

    const users: UserSeed[] = [
      {
        email: "admin@treeo2.local",
        passwordHash: passwordHashes.admin,
        name: "TreeO2 Admin",
        roleName: "Admin",
        cardId: "CARD-ADM-001",
        governmentId: "GOV-ADM-001",
        gender: "Male",
        disability: false,
        countryIso2: "TL",
        adminLocationCode: "DIL",
        streetAddress: "Dili Central Office",
        preferredLanguage: "en",
        biography: "System administrator for TreeO2.",
        notes: "Primary admin account.",
        accountActive: true,
        dateJoined: new Date("2025-01-05T00:00:00Z"),
      },
      {
        email: "manager@treeo2.local",
        passwordHash: passwordHashes.manager,
        name: "Project Manager",
        roleName: "Manager",
        cardId: "CARD-MGR-001",
        governmentId: "GOV-MGR-001",
        gender: "Female",
        disability: false,
        countryIso2: "TL",
        adminLocationCode: "DIL",
        streetAddress: "Dili Operations",
        preferredLanguage: "en",
        biography: "Oversees project delivery and monitoring.",
        notes: "Assigned to multiple projects.",
        accountActive: true,
        dateJoined: new Date("2025-01-10T00:00:00Z"),
      },
      {
        email: "inspector1@treeo2.local",
        passwordHash: passwordHashes.inspector1,
        name: "Field Inspector One",
        roleName: "Inspector",
        cardId: "CARD-INS-001",
        governmentId: "GOV-INS-001",
        gender: "Male",
        disability: false,
        countryIso2: "TL",
        adminLocationCode: "CRI",
        streetAddress: "Cristo Rei Field Office",
        preferredLanguage: "tet",
        biography: "Conducts on-site inspections.",
        notes: "Experienced in field validations.",
        accountActive: true,
        dateJoined: new Date("2025-01-12T00:00:00Z"),
      },
      {
        email: "inspector2@treeo2.local",
        passwordHash: passwordHashes.inspector2,
        name: "Field Inspector Two",
        roleName: "Inspector",
        cardId: "CARD-INS-002",
        governmentId: "GOV-INS-002",
        gender: "Female",
        disability: false,
        countryIso2: "TL",
        adminLocationCode: "BAU",
        streetAddress: "Baucau Field Office",
        preferredLanguage: "tet",
        biography: "Supports rural inspection activities.",
        notes: "Assigned to Baucau pilot.",
        accountActive: true,
        dateJoined: new Date("2025-01-13T00:00:00Z"),
      },
      {
        email: "farmer1@treeo2.local",
        passwordHash: passwordHashes.farmer1,
        name: "Farmer One",
        roleName: "Farmer",
        cardId: "CARD-FAR-001",
        governmentId: "GOV-FAR-001",
        gender: "Female",
        disability: false,
        countryIso2: "TL",
        adminLocationCode: "HER",
        streetAddress: "Hera Village",
        preferredLanguage: "tet",
        biography: "Participating farmer in Hera region.",
        notes: "Linked to reforestation project.",
        accountActive: true,
        dateJoined: new Date("2025-01-15T00:00:00Z"),
      },
      {
        email: "farmer2@treeo2.local",
        passwordHash: passwordHashes.farmer2,
        name: "Farmer Two",
        roleName: "Farmer",
        cardId: "CARD-FAR-002",
        governmentId: "GOV-FAR-002",
        gender: "Male",
        disability: false,
        countryIso2: "TL",
        adminLocationCode: "BAU",
        streetAddress: "Baucau Rural Area",
        preferredLanguage: "tet",
        biography: "Farmer involved in agroforestry activities.",
        notes: "Linked to Baucau pilot.",
        accountActive: true,
        dateJoined: new Date("2025-01-16T00:00:00Z"),
      },
      {
        email: "developer@treeo2.local",
        passwordHash: passwordHashes.developer,
        name: "Developer User",
        roleName: "Developer",
        cardId: "CARD-DEV-001",
        governmentId: "GOV-DEV-001",
        gender: "Male",
        disability: false,
        countryIso2: "AU",
        adminLocationCode: null,
        streetAddress: "Melbourne Support Hub",
        preferredLanguage: "en",
        biography: "Maintains the technical platform.",
        notes: "Support and development account.",
        accountActive: true,
        dateJoined: new Date("2025-01-18T00:00:00Z"),
      },
    ];

    for (const user of users) {
      await upsertUser(tx, {
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        roleId: roleIdsByName[user.roleName],
        cardId: user.cardId,
        governmentId: user.governmentId,
        gender: user.gender,
        disability: user.disability,
        countryId: countryIdsByIso2[user.countryIso2],
        adminLocationId: user.adminLocationCode
          ? locationIdsByCode[user.adminLocationCode]
          : null,
        streetAddress: user.streetAddress,
        preferredLanguage: user.preferredLanguage,
        photoId: null,
        biography: user.biography,
        notes: user.notes,
        accountActive: user.accountActive,
        dateJoined: user.dateJoined,
        canSignIn: true,
        accessToken: null,
        accessTokenCreated: null,
        resetToken: null,
        resetTokenExpires: null,
      });
    }

    const admin = await tx.user.findUniqueOrThrow({
      where: { email: "admin@treeo2.local" },
    });

    const manager = await tx.user.findUniqueOrThrow({
      where: { email: "manager@treeo2.local" },
    });

    const inspector1 = await tx.user.findUniqueOrThrow({
      where: { email: "inspector1@treeo2.local" },
    });

    const inspector2 = await tx.user.findUniqueOrThrow({
      where: { email: "inspector2@treeo2.local" },
    });

    const farmer1 = await tx.user.findUniqueOrThrow({
      where: { email: "farmer1@treeo2.local" },
    });

    const farmer2 = await tx.user.findUniqueOrThrow({
      where: { email: "farmer2@treeo2.local" },
    });

    const developer = await tx.user.findUniqueOrThrow({
      where: { email: "developer@treeo2.local" },
    });

    await tx.userRoleAssignment.createMany({
      data: [
        { userId: admin.id, roleId: roles.admin.id },
        { userId: manager.id, roleId: roles.manager.id },
        { userId: inspector1.id, roleId: roles.inspector.id },
        { userId: inspector2.id, roleId: roles.inspector.id },
        { userId: farmer1.id, roleId: roles.farmer.id },
        { userId: farmer2.id, roleId: roles.farmer.id },
        { userId: developer.id, roleId: roles.developer.id },
      ],
      skipDuplicates: true,
    });

    await tx.userProject.createMany({
      data: [
        { userId: manager.id, projectId: heraProject.id },
        { userId: manager.id, projectId: baucauProject.id },
        { userId: inspector1.id, projectId: heraProject.id },
        { userId: inspector2.id, projectId: baucauProject.id },
        { userId: farmer1.id, projectId: heraProject.id },
        { userId: farmer2.id, projectId: baucauProject.id },
      ],
      skipDuplicates: true,
    });

    await tx.projectTreeType.createMany({
      data: [
        { projectId: heraProject.id, treeTypeId: mahogany.id },
        { projectId: heraProject.id, treeTypeId: sandalwood.id },
        { projectId: baucauProject.id, treeTypeId: teak.id },
      ],
      skipDuplicates: true,
    });

    const heraBatch = await upsertScanBatch(tx, {
      inspectorId: inspector1.id,
      projectId: heraProject.id,
      uploadedAt: new Date("2025-02-01T09:00:00Z"),
    });

    const baucauBatch = await upsertScanBatch(tx, {
      inspectorId: inspector2.id,
      projectId: baucauProject.id,
      uploadedAt: new Date("2025-02-10T11:30:00Z"),
    });

    const treeScan1 = await upsertTreeScan(tx, {
      fobId: "FOB-0001",
      projectId: heraProject.id,
      farmerId: farmer1.id,
      inspectorId: inspector1.id,
      speciesId: mahogany.id,
      estimatedPlantedYear: 2023,
      estimatedPlantedMonth: 6,
      plantedDate: new Date("2023-06-15T00:00:00Z"),
      heightM: new Prisma.Decimal("1.450"),
      circumferenceCm: new Prisma.Decimal("8.400"),
      diameterCm: new Prisma.Decimal("2.700"),
      latitude: -8.5331,
      longitude: 125.6331,
      photoId: null,
      batchId: heraBatch.id,
      deviceId: "DEVICE-01",
      isArchived: false,
      isCorrected: false,
      correctedBy: null,
      correctionReason: null,
      isValid: true,
      validationNotes: "Healthy sapling observed.",
    });

    const treeScan2 = await upsertTreeScan(tx, {
      fobId: "FOB-0002",
      projectId: heraProject.id,
      farmerId: farmer1.id,
      inspectorId: inspector1.id,
      speciesId: sandalwood.id,
      estimatedPlantedYear: 2022,
      estimatedPlantedMonth: 11,
      plantedDate: new Date("2022-11-20T00:00:00Z"),
      heightM: new Prisma.Decimal("0.950"),
      circumferenceCm: new Prisma.Decimal("5.600"),
      diameterCm: new Prisma.Decimal("1.800"),
      latitude: -8.5335,
      longitude: 125.6338,
      photoId: null,
      batchId: heraBatch.id,
      deviceId: "DEVICE-01",
      isArchived: false,
      isCorrected: true,
      correctedBy: manager.id,
      correctionReason: "Corrected planting month after review.",
      isValid: true,
      validationNotes: "Data verified by manager.",
    });

    const treeScan3 = await upsertTreeScan(tx, {
      fobId: "FOB-0101",
      projectId: baucauProject.id,
      farmerId: farmer2.id,
      inspectorId: inspector2.id,
      speciesId: teak.id,
      estimatedPlantedYear: 2024,
      estimatedPlantedMonth: 3,
      plantedDate: new Date("2024-03-05T00:00:00Z"),
      heightM: new Prisma.Decimal("1.800"),
      circumferenceCm: new Prisma.Decimal("10.200"),
      diameterCm: new Prisma.Decimal("3.100"),
      latitude: -8.4662,
      longitude: 126.4491,
      photoId: null,
      batchId: baucauBatch.id,
      deviceId: "DEVICE-02",
      isArchived: false,
      isCorrected: false,
      correctedBy: null,
      correctionReason: null,
      isValid: true,
      validationNotes: "Strong early growth.",
    });

    await upsertTreeScanAudit(tx, {
      treeScanId: treeScan2.id,
      changedBy: manager.id,
      changeReason: "Updated planting month",
      oldData: { estimatedPlantedMonth: 10 },
      newData: { estimatedPlantedMonth: 11 },
      changedAt: new Date("2025-02-02T12:00:00Z"),
    });

    const adopter1 = await upsertAdopter(tx, {
      name: "Green Earth Donor",
      email: "donor1@example.com",
    });

    const adopter2 = await upsertAdopter(tx, {
      name: "Eco Supporter",
      email: "donor2@example.com",
    });

    await upsertAdoption(tx, {
      adopterId: adopter1.id,
      fobId: treeScan1.fobId,
      adoptedAt: new Date("2025-02-15T00:00:00Z"),
    });

    await upsertAdoption(tx, {
      adopterId: adopter2.id,
      fobId: treeScan3.fobId,
      adoptedAt: new Date("2025-02-20T00:00:00Z"),
    });

    await upsertReport(tx, {
      reportType: "Tree Survival Summary",
      requestedBy: manager.id,
      status: "COMPLETE",
      parameters: { projectId: heraProject.id, month: "2025-02" },
      outputUrl: "https://xyz.com/reports/tree-survival-summary.pdf",
      completedAt: new Date("2025-02-28T10:00:00Z"),
    });

    await upsertReport(tx, {
      reportType: "Inspector Activity Report",
      requestedBy: admin.id,
      status: "PENDING",
      parameters: { inspectorId: inspector1.id },
      outputUrl: null,
      completedAt: null,
    });
  });

  console.log("Seed completed successfully.");
  console.log("Test login accounts were seeded.");
}

void main()
  .catch((err: unknown) => {
    console.error("Seed failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
