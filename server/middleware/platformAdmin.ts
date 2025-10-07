import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "admin-secret-key";

export interface PlatformAdminRequest extends Request {
  admin?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const requirePlatformAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token required" });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as any;

    if (!decoded.isAdmin || decoded.role !== "platform_admin") {
      return res.status(403).json({ message: "Platform admin access required" });
    }

    // Verify user still exists and has platform_admin role
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user || user.role !== "platform_admin") {
      return res.status(403).json({ message: "Platform admin access required" });
    }

    req.admin = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Platform admin auth error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
