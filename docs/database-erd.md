# TreeO2 Database ERD Generation Guide

## Purpose

This document explains how to generate and maintain the **Entity Relationship Diagram (ERD)** for the TreeO2 database.

The ERD is generated directly from the Prisma schema in the main TreeO2 repository.

A separate temporary repository is not required.

The generated ERD is saved to:

```text
docs/database-erd.svg
```

---

## How ERD Generation Works

TreeO2 uses the following tools:

- `prisma-erd-generator`
- `@mermaid-js/mermaid-cli`

The generation process is:

```text
prisma/schema.prisma
        ↓
prisma-erd-generator
        ↓
Mermaid CLI
        ↓
docs/database-erd.svg
```

`prisma-erd-generator` reads the models and relationships defined in the Prisma schema.

Mermaid CLI (`mmdc`) renders the generated diagram as an SVG file.

---

## Install Project Dependencies

From the root of the TreeO2 repository, run:

```bash
npm install
```

This installs the dependencies defined in `package.json`.

The ERD generation tools are stored as development dependencies:

```json
"@mermaid-js/mermaid-cli": "^11.17.0",
"prisma-erd-generator": "^3.2.1"
```

Other developers only need to run:

```bash
npm install
```

to install the dependencies already defined in the project.

---

## Prisma ERD Generator Configuration

The ERD generator is configured in:

```text
prisma/schema.prisma
```

The Prisma schema contains:

```prisma
generator client {
  provider = "prisma-client-js"
}

generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/database-erd.svg"
}
```

The `client` generator is used by the TreeO2 backend.

The `erd` generator is used to create the database ERD.

---

## ERD npm Script

The ERD generation script is defined in `package.json`:

```json
"erd:generate": "prisma generate --schema prisma --generator erd"
```

The normal Prisma Client generation script is defined separately:

```json
"prisma:generate": "prisma generate --schema prisma --generator client"
```

This keeps the two generation processes separate.

### Prisma Client

```bash
npm run prisma:generate
```

Generates the Prisma Client used by the backend.

### Database ERD

```bash
npm run erd:generate
```

Generates only the database ERD.

---

# Updating the ERD After Database Changes

The ERD can be regenerated when Prisma schema changes are made and an updated diagram is needed.

Examples include:

- New Prisma models
- Removed Prisma models
- New relationships
- Modified relationships
- New or changed foreign keys
- Primary key changes
- New database fields
- Database restructuring
- Other significant Prisma schema changes

Before regenerating the ERD, make sure the working branch contains the latest relevant Prisma schema changes.

For example:

```bash
git fetch origin
git rebase origin/master
```

Then regenerate the ERD:

```bash
npm run erd:generate
```

The ERD will be regenerated from the Prisma schema currently available on the branch.

The updated file will be:

```text
docs/database-erd.svg
```

Review the generated ERD to confirm that it contains the expected:

- Models
- Fields
- Primary keys
- Foreign keys
- Relationships

The ERD should reflect the current contents of:

```text
prisma/schema.prisma
```

---

# Files Used for ERD Generation

The main files involved are:

```text
TreeO2/
├── package.json
├── package-lock.json
├── prisma/
│   └── schema.prisma
└── docs/
    ├── database-erd.md
    └── database-erd.svg
```

### `package.json`

Contains:

- ERD development dependencies
- `erd:generate` npm script

### `package-lock.json`

Records the exact versions of the installed npm dependencies.

### `prisma/schema.prisma`

Contains:

- Database models
- Database relationships
- Prisma Client generator
- ERD generator

### `docs/database-erd.svg`

Contains the generated TreeO2 database ERD.

### `docs/database-erd.md`

Contains this guide.

---

# Troubleshooting

## ERD Generator Cannot Be Found

First install the project dependencies:

```bash
npm install
```

Then retry:

```bash
npm run erd:generate
```

---

## Mermaid CLI or `mmdc` Cannot Be Found

The ERD generator requires Mermaid CLI to render the SVG.

First run:

```bash
npm install
```

Then retry:

```bash
npm run erd:generate
```

---

## ERD Generation Fails Due to Missing Chrome Headless Shell

In some environments, ERD generation may fail because Mermaid CLI cannot find the Chrome Headless Shell required by Puppeteer.

The error may indicate that Chrome is not installed or that the Puppeteer browser executable cannot be found.

Install the required browser with:

```bash
npx puppeteer browsers install chrome-headless-shell
```

Then retry the ERD generation:

```bash
npm run erd:generate
```

This may be required on some systems depending on the local Puppeteer and Mermaid CLI setup.

---

## ERD File Is Not Generated

Confirm that `prisma/schema.prisma` contains:

```prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/database-erd.svg"
}
```

Also confirm that `package.json` contains:

```json
"erd:generate": "prisma generate --schema prisma --generator erd"
```

Then run:

```bash
npm run erd:generate
```

---