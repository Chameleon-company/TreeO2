import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", (req: Request, res: Response, next: NextFunction): void => {
  void (async () => {
    try {
      const data = await prisma.projectOrganisation.findMany({
        include: {
          organisation: true,
          project: true,
        },
      });

      res.json(data);
    } catch (error) {
      next(error);
    }
  })();
});

router.post("/", (req: Request, res: Response, next: NextFunction): void => {
  void (async () => {
    try {
      const { projectId, organisationId } = req.body as {
        projectId: number;
        organisationId: number;
      };

      if (!projectId || !organisationId) {
        res.status(400).json({
          message: "projectId and organisationId are required",
        });
        return;
      }

      const existing = await prisma.projectOrganisation.findUnique({
        where: {
          projectId_organisationId: {
            projectId,
            organisationId,
          },
        },
      });

      if (existing) {
        res.status(409).json({
          message: "Relation already exists",
        });
        return;
      }

      const result = await prisma.projectOrganisation.create({
        data: {
          projectId,
          organisationId,
        },
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  })();
});

router.delete(
  "/:projectId/:organisationId",
  (req: Request, res: Response, next: NextFunction): void => {
    void (async () => {
      try {
        const { projectId, organisationId } = req.params as {
          projectId: string;
          organisationId: string;
        };

        const result = await prisma.projectOrganisation.delete({
          where: {
            projectId_organisationId: {
              projectId: Number(projectId),
              organisationId: Number(organisationId),
            },
          },
        });

        res.json(result);
      } catch (error) {
        next(error);
      }
    })();
  },
);

export default router;
