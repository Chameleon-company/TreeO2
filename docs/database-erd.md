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

## Requirements

Before generating the ERD, ensure the following are installed:

- Git
- Node.js
- npm

Check that they are available:

```bash
git --version
node --version
npm --version
```

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

Once these dependencies have been committed to the repository, other developers do not need to install them individually.

They only need to run:

```bash
npm install
```

### Adding the ERD Dependencies

If the ERD dependencies are not yet present in `package.json`, they can be added with:

```bash
npm install -D prisma-erd-generator @mermaid-js/mermaid-cli
```

The `-D` option adds the packages to `devDependencies`.

This automatically updates:

```text
package.json
package-lock.json
```

---

## Prisma ERD Generator Configuration

The ERD generator is configured in:

```text
prisma/schema.prisma
```

The Prisma schema should contain:

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

The ERD generation command is defined in `package.json`.

Add the following script inside the existing `"scripts"` section:

```json
"erd:generate": "prisma generate --schema prisma --generator erd"
```

The normal Prisma Client generation script can remain separate:

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

## Generate the ERD

From the root of the TreeO2 repository, run:

```bash
npm run erd:generate
```

The generator reads:

```text
prisma/schema.prisma
```

and creates:

```text
docs/database-erd.svg
```

Open the SVG in Visual Studio Code, GitHub, or a web browser to review the generated diagram.

---

# Updating the ERD After Database Changes

The ERD should be regenerated when database-related changes are merged into the TreeO2 `master` branch.

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

Before regenerating the ERD, update the working branch with the latest changes from `master`.

---

## Step 1 – Check the Current Branch

Check which branch you are currently using:

```bash
git branch
```

Also check whether there are any uncommitted changes:

```bash
git status
```

If there are important uncommitted changes, commit or stash them before rebasing.

---

## Step 2 – Fetch the Latest Repository Changes

Retrieve the latest changes from GitHub:

```bash
git fetch origin
```

This updates your local knowledge of the remote branches without changing your current working files.

---

## Step 3 – Rebase onto the Latest Master Branch

Update the current ERD working branch with the latest changes from `master`:

```bash
git rebase origin/master
```

This brings the latest TreeO2 changes into the current branch while keeping the branch history clean.

If there are merge conflicts, Git will stop the rebase and identify the affected files.

Resolve the conflicts, then run:

```bash
git add <resolved-file>
git rebase --continue
```

Repeat until the rebase completes.

If the rebase needs to be cancelled:

```bash
git rebase --abort
```

---

## Step 4 – Install Any Updated Dependencies

If `package.json` or `package-lock.json` changed after updating the branch, run:

```bash
npm install
```

This ensures the local project has the dependencies required by the latest version of TreeO2.

---

## Step 5 – Regenerate the ERD

Run:

```bash
npm run erd:generate
```

The ERD will be regenerated from the latest local Prisma schema.

The updated file will be:

```text
docs/database-erd.svg
```

---

## Step 6 – Review the Updated ERD

Open:

```text
docs/database-erd.svg
```

Check that the diagram contains the expected:

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

## Updating When You Have Uncommitted Changes

If changes need to be temporarily stored before rebasing, use:

```bash
git stash -u
```

Then update the branch:

```bash
git fetch origin
git rebase origin/master
```

Restore the saved changes:

```bash
git stash pop
```

Then regenerate the ERD:

```bash
npm run erd:generate
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

If `prisma-erd-generator` is not present in `package.json`, install it with:

```bash
npm install -D prisma-erd-generator
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

If `@mermaid-js/mermaid-cli` is not present in `package.json`, install it with:

```bash
npm install -D @mermaid-js/mermaid-cli
```

Then retry:

```bash
npm run erd:generate
```

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

## ERD Appears Outdated

Fetch and apply the latest changes from `master`:

```bash
git fetch origin
git rebase origin/master
```

Then regenerate the diagram:

```bash
npm run erd:generate
```

The resulting ERD will reflect the Prisma schema currently available on the branch.

---

# Quick Reference

### First-time setup

```bash
npm install
npm run erd:generate
```

### Update the ERD after changes are merged into master

```bash
git fetch origin
git rebase origin/master
npm install
npm run erd:generate
```

### Generated ERD location

```text
docs/database-erd.svg
```