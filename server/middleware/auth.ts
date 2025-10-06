import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
  throw new Error(
    "JWT_SECRET and REFRESH_SECRET environment variables must be set. Application cannot start without secure token signing keys."
  );
}

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export interface AuthTokenPayload {
  userId: string;
  email: string;
  currentOrgId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export function generateAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as AuthTokenPayload;
  } catch (error) {
    return null;
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.user = payload;
  next();
}

export function requireOrg(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.currentOrgId) {
    return res.status(403).json({ message: "Organization context required" });
  }
  next();
}
