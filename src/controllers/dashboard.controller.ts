import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// GET /api/dashboard/summary
export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const incomeAgg = await prisma.financialRecord.aggregate({
      where: { type: "INCOME" },
      _sum: { amount: true },
    });
    
    const expenseAgg = await prisma.financialRecord.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    });

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpenses = expenseAgg._sum.amount || 0;
    const netBalance = totalIncome - totalExpenses;

    res.json({ totalIncome, totalExpenses, netBalance });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/category-totals
export const getCategoryTotals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totals = await prisma.financialRecord.groupBy({
      by: ["category", "type"],
      _sum: { amount: true },
    });

    res.json(totals.map((t: any) => ({
      category: t.category,
      type: t.type,
      total: t._sum.amount || 0
    })));
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/trends
export const getTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // For simplicity without raw timezone-complex SQL, we pull recent records and bucket them by YYYY-MM
    // In a massive production system, use RAW sql with DATE_TRUNC
    const records = await prisma.financialRecord.findMany({
      orderBy: { date: 'asc' }
    });

    const trends: Record<string, { income: number, expense: number }> = {};

    records.forEach((r: any) => {
      const monthKey = r.date.toISOString().substring(0, 7); // e.g., "2023-10"
      if (!trends[monthKey]) trends[monthKey] = { income: 0, expense: 0 };
      
      if (r.type === "INCOME") trends[monthKey].income += r.amount;
      else trends[monthKey].expense += r.amount;
    });

    res.json(trends);
  } catch (err) {
    next(err);
  }
};
