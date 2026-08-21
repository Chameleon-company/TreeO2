# TreeO2 ERD Generation Guide

## Purpose

This document explains how to generate and maintain an **Entity Relationship Diagram (ERD)** for the TreeO2 project using Prisma.

A separate temporary local copy of the TreeO2 repository is used for ERD generation. This allows the required ERD tools and configuration to be added without affecting the primary local TreeO2 development repository.

The temporary repository can later be updated from the latest TreeO2 GitHub `master` branch whenever database changes are merged.

---

## Requirements

Before generating the ERD, ensure the following are available:

- Access to the **TreeO2 GitHub repository**
- **Git** installed
- **Node.js** installed
- **npm** installed
- **Visual Studio Code** or another code editor
- Prisma project files
- Internet connection for installing npm packages

Check that Git, Node.js, and npm are installed:

```bash
git --version
node --version
npm --version
```

If version numbers are returned, the required tools are installed correctly.

---

## Step 1 – Create a Temporary TreeO2 Repository

To avoid modifying the primary local TreeO2 repository, create a separate copy specifically for ERD generation.

Clone the TreeO2 repository:

```bash
git clone <TreeO2-repository-URL> TreeO2-ERD
```

Navigate into the temporary repository:

```bash
cd TreeO2-ERD
```

This repository will be used specifically for ERD generation and related configuration.

> **Note:** Changes made inside this temporary repository will not automatically affect the primary local TreeO2 repository.

---

## Step 2 – Create an ERD Working Branch

Create a separate branch for the ERD generation configuration:

```bash
git switch -c erd-generation
```

Confirm the current branch:

```bash
git branch
```

The output should show:

```text
* erd-generation
  master
```

Using a separate branch keeps the ERD-specific configuration separate from the temporary repository's local `master` branch.

---

## Step 3 – Locate the Prisma Schema

Locate the Prisma schema used by the TreeO2 project.

The schema is generally located within the Prisma directory:

```text
prisma/schema.prisma
```

The Prisma schema defines the database structure, including:

- Models
- Primary keys
- Foreign keys
- Relationships
- Data types
- Constraints
- Database mappings

The ERD is generated using the information contained within the Prisma schema.

---

## Step 4 – Install Required Dependencies

Install the existing project dependencies:

```bash
npm install
```

Then install the Prisma ERD generator:

```bash
npm install prisma-erd-generator
```

The `prisma-erd-generator` package allows an ERD to be automatically generated from the Prisma database schema.

---

## Step 5 – Configure the ERD Generator

Open the Prisma schema and add the ERD generator configuration if it is not already present.

For example:

```prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/erd.svg"
}
```

The `provider` specifies which ERD generator Prisma should use.

The `output` specifies where the generated ERD should be saved.

If the required documentation directory does not exist, create it before generating the ERD.

---

## Step 6 – Generate the ERD

Run:

```bash
npx prisma generate
```

Prisma will process the database schema and generate the ERD.

After generation, check the configured output location.

For example:

```text
docs/erd.svg
```

Open the SVG file using Visual Studio Code or a web browser to review the generated diagram.

---


# Updating the Temporary ERD Repository

The TreeO2 project will continue to change as new Pull Requests are merged into the GitHub `master` branch.

The temporary ERD repository should therefore be updated before generating a new version of the ERD.

> **Important:** The primary local TreeO2 repository does not need to be updated first. The temporary ERD repository can retrieve the latest changes directly from GitHub.

Navigate to the temporary repository:

```bash
cd TreeO2-ERD
```

Confirm that you are using the ERD branch:

```bash
git branch
```

The output should show:

```text
* erd-generation
```

---

# Standard ERD Update Process

When a significant database-related Pull Request is merged into TreeO2, the standard update process is:

```bash
cd TreeO2-ERD

git status

git fetch origin

git rebase origin/master

npx prisma generate
```

If there are uncommitted changes:

```bash
git stash -u

git fetch origin

git rebase origin/master

git stash pop

npx prisma generate
```

---

# Do I Need to Create a New Temporary Repository Every Time?

**No.**

The existing `TreeO2-ERD` repository can be reused.

Whenever TreeO2 changes, the temporary repository can retrieve the latest project changes using:

```bash
git fetch origin
git rebase origin/master
```

This means the ERD generator and its configuration do not need to be installed again every time the database changes.

A completely new temporary repository should generally only be required if:

- The temporary repository becomes corrupted
- Major TreeO2 restructuring breaks the existing ERD setup
- A completely clean environment is required for testing

---

# Recommended Repository Structure

The local development environment can contain two separate TreeO2 repositories:

```text
Computer
│
├── TreeO2
│   └── Primary local development repository
│
└── TreeO2-ERD
    └── Temporary repository used for ERD generation
```

Both repositories connect independently to the TreeO2 GitHub repository.

The primary `TreeO2` repository is used for normal development.

The `TreeO2-ERD` repository is used for:

- ERD generation
- ERD configuration
- ERD testing
- Database documentation

Changes inside `TreeO2-ERD` do not automatically modify the primary TreeO2 development repository.

---

# When Should the ERD Be Updated?

The ERD should be regenerated after significant database changes, including:

- New Prisma models
- Removed Prisma models
- New database relationships
- Modified relationships
- New foreign keys
- Changes to primary keys
- Changes to user or role relationships
- Database restructuring
- Major Prisma schema changes

Before regenerating the ERD, update the temporary repository from the latest TreeO2 `master` branch.

---

# Troubleshooting

## Prisma Command Is Not Recognised

Use:

```bash
npx prisma generate
```

Using `npx` runs the locally installed Prisma version.

---

## ERD Is Not Generated

Confirm that `prisma-erd-generator` is installed:

```bash
npm install prisma-erd-generator
```

Also confirm that the ERD generator configuration exists in the Prisma schema.

Example:

```prisma
generator erd {
  provider = "prisma-erd-generator"
  output   = "../docs/erd.svg"
}
```

---

## ERD Appears Outdated

The temporary repository may not contain the latest TreeO2 database changes.

Run:

```bash
git fetch origin
git rebase origin/master
```

Then regenerate the ERD:

```bash
npx prisma generate
```