import { Router } from "express";
import { HealthController } from "./health.controller";
import "./health.docs";

const router = Router();
const healthController = new HealthController();

router.get("/", (req, res) => {
	void healthController.getHealth(req, res);
});

export default router;
