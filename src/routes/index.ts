import { Router } from "express";
import projectOrganisationsRoutes from "./projectOrganisation";

const router = Router();

router.use("/project-organisations", projectOrganisationsRoutes);

export default router;