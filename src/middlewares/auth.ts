import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { setAuthCookies, clearAuthCookies, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } from "../utils/cookies.util";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
  };
}

const ACCESS_JWT_SECRET = process.env.ACCESS_JWT_SECRET!;
const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET!;


export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  // Case 1: Valid access token provided
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, ACCESS_JWT_SECRET) as any;
      req.user = { userId: decoded.userId, role: decoded.role };
      next();
      return;
    } catch (err) {
      if (err instanceof Error && err.name !== "TokenExpiredError") {
        res.status(401).json({ error: true, message: "Invalid token" });
        return;
      }
      // Access token expired, let it fall through to check refresh token
    }
  }

  // Case 2: Auto-refresh requires a refreshToken cookie to be present
  if (!refreshToken) {
    res.status(401).json({ error: true, message: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_JWT_SECRET) as any;
    
    // Check against DB
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || user.refreshToken !== refreshToken) {
      clearAuthCookies(res);
      res.status(401).json({ error: true, message: "Token has been revoked" });
      return;
    }

    if (user.status !== "ACTIVE") {
      await prisma.user.update({ where: { id: user.id }, data: { refreshToken: null } });
      clearAuthCookies(res);
      res.status(401).json({ error: true, message: "Account is inactive" });
      return;
    }

    // Token rotation: issue a new pair
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role, status: user.status },
      ACCESS_JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);

    req.user = { userId: user.id, role: user.role };
    next();
  } catch (err) {
    clearAuthCookies(res);
    res.status(401).json({ error: true, message: "Session expired, please log in again" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: true, message: "Unauthenticated" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: true, 
        message: `Forbidden: Your role '${req.user.role}' does not have access. Required: ${allowedRoles.join(" | ")}` 
      });
      return;
    }
    next();
  };
};
