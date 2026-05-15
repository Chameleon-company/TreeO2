import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// GET all relations
router.get("/", async (_req, res, next) => {
  try {
    const data = await prisma.projectOrganisation.findMany({
      include: {
        organisation: true,
        project: true,
      },
    });

    return res.json(data);
  } catch (error) {
    next(error);
  }
});

// CREATE relation
router.post("/", async (req, res, next) => {
  try {
    const projectId = Number(req.body.projectId);
    const organisationId = Number(req.body.organisationId);

    if (!projectId || !organisationId) {
      return res.status(400).json({
        message: "projectId and organisationId are required",
      });
    }

    // SAFETY CHECK 
    const existing = await prisma.projectOrganisation.findUnique({
      where: {
        projectId_organisationId: {
          projectId,
          organisationId,
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        message: "Relation already exists",
      });
    }

    const result = await prisma.projectOrganisation.create({
      data: {
        projectId,
        organisationId,
      },
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE relation
router.delete("/:projectId/:organisationId", async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const organisationId = Number(req.params.organisationId);

    const result = await prisma.projectOrganisation.delete({
      where: {
        projectId_organisationId: {
          projectId,
          organisationId,
        },
      },
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;