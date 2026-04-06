import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createRecordSchema, getRecordsQuerySchema } from "../schemas/record.schema";
import { createRecord, getRecords, getRecordById, updateRecord, deleteRecord } from "../controllers/record.controller";

const router = Router();

// Base auth requirement
router.use(requireAuth);

// Analysts and Admins can view
router.get("/", requireRole(["ANALYST", "ADMIN"]), validate(getRecordsQuerySchema), getRecords);
router.get("/:id", requireRole(["ANALYST", "ADMIN"]), getRecordById);

// Only Admins can create/update/delete
router.post("/", requireRole(["ADMIN"]), validate(createRecordSchema), createRecord);
router.put("/:id", requireRole(["ADMIN"]), validate(createRecordSchema), updateRecord);
router.patch("/:id", requireRole(["ADMIN"]), deleteRecord);

export default router;
