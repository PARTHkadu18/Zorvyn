import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { 
  ACCESS_TOKEN_EXPIRY, 
  REFRESH_TOKEN_EXPIRY, 
  setAuthCookies, 
  clearAuthCookies 
} from "../utils/cookies.util";

const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET!;
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET!;


const issueTokens = async (res: Response, user: { id: number; role: string; status: string }) => {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role, status: user.status },
    ACCESS_JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  setAuthCookies(res, accessToken, refreshToken);
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
       res.status(400).json({ error: true, message: "Email already in use" });
       return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || "VIEWER",
      },
    });

    await issueTokens(res, { id: user.id, role: user.role, status: user.status });

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
       res.status(401).json({ error: true, message: "User not found" });
       return;
    }

    if (user.status !== "ACTIVE") {
       res.status(403).json({ error: true, message: "Account is inactive" });
       return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       res.status(401).json({ error: true, message: "Wrong password" });
       return;
    }

    await issueTokens(res, { id: user.id, role: user.role, status: user.status });

    res.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await prisma.user.findFirst({ where: { refreshToken } });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: null },
        });
      }
    }

    clearAuthCookies(res);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
