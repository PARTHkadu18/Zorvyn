import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth";
import { getSummary, getCategoryTotals, getTrends } from "../controllers/dashboard.controller";

const router = Router();

// Only Analysts and Admins can view dashboard data
router.use(requireAuth, requireRole(["ANALYST", "ADMIN"]));

router.get("/summary", getSummary);
router.get("/category-totals", getCategoryTotals);
router.get("/trends", getTrends);

export default router;
