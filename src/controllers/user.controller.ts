import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Helper function: find user by ID or send 404
const findUserOrFail = async (id: string, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
  });
  if (!user) {
    res.status(404).json({ error: true, message: "User not found" });
    return null;
  }
  return user;
};

// GET /api/users
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const rawLimit = parseInt(req.query.limit as string) || 10;
    const limit = Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        skip,
        take: limit,
        select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.count()
    ]);

    res.json({
      data: users,
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

// PUT /api/users/:id/role
export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const existingUser = await findUserOrFail(id as string, res);
    if (!existingUser) return;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    res.json({ message: "User role updated", user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id/status
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const existingUser = await findUserOrFail(id as string, res);

    if (!existingUser) return;
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { status },
      select: { id: true, email: true, status: true },
    });
    res.json({ message: "User status updated", user });
  } catch (err) {
    next(err);
  }
};
