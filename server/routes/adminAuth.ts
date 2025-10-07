import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "admin-secret-key";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Admin login - separate from org user login
router.post("/login", async (req, res) => {
  try {
    const body = adminLoginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, body.email));
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if user is platform admin
    if (user.role !== "platform_admin") {
      return res.status(403).json({ message: "Access denied. Platform admin access required." });
    }

    const isValidPassword = await bcrypt.compare(body.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate admin-specific JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: true,
    };

    const accessToken = jwt.sign(payload, ADMIN_JWT_SECRET, {
      expiresIn: "12h", // Longer session for admins
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin logout
router.post("/logout", async (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Get current admin user
router.get("/me", async (req, res) => {
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

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user || user.role !== "platform_admin") {
      return res.status(403).json({ message: "Platform admin access required" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin me error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Change password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

router.post("/change-password", async (req, res) => {
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

    const body = changePasswordSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user || user.role !== "platform_admin") {
      return res.status(403).json({ message: "Platform admin access required" });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(body.currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Change password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
