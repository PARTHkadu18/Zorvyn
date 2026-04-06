import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import type { AuthRequest } from "../middlewares/auth";

// Helper function: find record by ID or send 404
const findRecordOrFail = async (id: string, res: Response) => {
  const record = await prisma.financialRecord.findUnique({
    where: { id: Number(id) },
  });
  if (!record || record.deletedAt) {
    res.status(404).json({ error: true, message: "Record not found" });
    return null;
  }
  return record;
};

// POST /api/records
export const createRecord = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, type, category, notes, date } = req.body;
    const userId = req.user!.userId;

    const record = await prisma.financialRecord.create({
      data: {
        amount,
        type,
        category,
        notes,
        date: date ? new Date(date) : new Date(),
        userId,
      },
    });

    res.status(201).json({ message: "Record created", record });
  } catch (err) {
    next(err);
  }
};

// GET /api/records
export const getRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, category } = req.query;
    
    const page = parseInt(req.query.page as string) || 1;
    const rawLimit = parseInt(req.query.limit as string) || 10;
    const limit = Math.min(rawLimit, 100); // Cap dynamically requested pages at 100
    const skip = (page - 1) * limit;

    const whereClause = {
      ...(type && { type: String(type) as "INCOME" | "EXPENSE" }),
      ...(category && { category: String(category) }),
    };

    const [records, total] = await prisma.$transaction([
      prisma.financialRecord.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.financialRecord.count({ where: whereClause })
    ]);

    res.json({
      data: records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/records/:id
export const getRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const record = await findRecordOrFail(id as string, res);
    if (!record) return;
    
    res.json(record);
  } catch (err) {
    next(err);
  }
};

// PUT /api/records/:id
export const updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, type, category, notes, date } = req.body;

    const existingRecord = await findRecordOrFail(id as string, res);
    if (!existingRecord) return;

    const record = await prisma.financialRecord.update({
      where: { id: Number(id) },
      data: {
        amount,
        type,
        category,
        notes,
        ...(date && { date: new Date(date) }),
      },
    });

    res.json({ message: "Record updated", record });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/records/:id
export const deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const existingRecord = await findRecordOrFail(id as string, res);
    if (!existingRecord) return;

    await prisma.financialRecord.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    res.json({ message: "Record deleted" });
  } catch (err) {
    next(err);
  }
};
