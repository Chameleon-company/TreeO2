import { Router, Request, Response, NextFunction } from "express";
import { UserManagementController } from "./userManagement.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import "./userManagement.docs";

type AsyncFn = (
	req: Request,
	res: Response,
	next: NextFunction,
) => Promise<unknown>;

const asyncHandler =
	(fn: AsyncFn) =>
	(req: Request, res: Response, next: NextFunction): void => {
		void Promise.resolve(fn(req, res, next)).catch(next);
	};

const router = Router();

router.get(
	"/",
	authMiddleware,
	roleMiddleware(["ADMIN", "MANAGER"]),
	asyncHandler(UserManagementController.getUsers),
);

router.get(
	"/:id",
	authMiddleware,
	asyncHandler(UserManagementController.getUserById),
);

router.post(
	"/",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	asyncHandler(UserManagementController.createUser),
);

router.put(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN", "MANAGER"]),
	asyncHandler(UserManagementController.updateUser),
);

router.delete(
	"/:id",
	authMiddleware,
	roleMiddleware(["ADMIN"]),
	asyncHandler(UserManagementController.deleteUser),
);

export default router;
