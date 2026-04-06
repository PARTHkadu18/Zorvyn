import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { getAllUsers, updateUserRole, updateUserStatus } from "../controllers/user.controller";
import { updateRoleSchema, updateStatusSchema } from "../schemas/user.schema";

const router = Router();

// Only Admins can manage users
router.use(requireAuth, requireRole(["ADMIN"]));

router.get("/", getAllUsers);
router.put("/:id/role", validate(updateRoleSchema), updateUserRole);
router.put("/:id/status", validate(updateStatusSchema), updateUserStatus);

export default router;
