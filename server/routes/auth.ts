import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { storage } from "../storage";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  authenticateToken,
  type AuthRequest,
} from "../middleware/auth";
import { insertUserSchema, insertOrganizationSchema } from "@shared/schema";
import { z } from "zod";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(1),
  gstin: z.string().length(15).optional().or(z.literal('')),
});

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  organizationName: z.string().min(1),
  organizationSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
});

router.post("/register", async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(body.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await storage.createUser({
      email: body.email,
      password: hashedPassword,
      name: body.fullName,
    });

    // Generate slug from org name
    const slug = body.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Set 20-day trial
    const trialDays = parseInt(process.env.TRIAL_DAYS || "20", 10);
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const organization = await storage.createOrganization({
      name: body.orgName,
      slug: slug,
      gstin: body.gstin || null,
      trialStartedAt,
      trialEndsAt,
      subscriptionStatus: "trialing",
      planId: "starter",
    });

    await storage.createMembership({
      userId: user.id,
      orgId: organization.id,
      role: "owner",
    });

    const payload = {
      userId: user.id,
      email: user.email,
      currentOrgId: organization.id,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storage.storeRefreshToken(user.id, tokenHash, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        currentOrgId: organization.id,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const body = signupSchema.parse(req.body);

    const existingUser = await storage.getUserByEmail(body.email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await storage.createUser({
      name: body.name,
      email: body.email,
      password: hashedPassword,
    });

    // Set 20-day trial
    const trialDays = parseInt(process.env.TRIAL_DAYS || "20", 10);
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const organization = await storage.createOrganization({
      name: body.organizationName,
      slug: body.organizationSlug,
      trialStartedAt,
      trialEndsAt,
      subscriptionStatus: "trialing",
      planId: "starter",
    });

    await storage.createMembership({
      userId: user.id,
      orgId: organization.id,
      role: "owner",
    });

    const payload = {
      userId: user.id,
      email: user.email,
      currentOrgId: organization.id,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storage.storeRefreshToken(user.id, tokenHash, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await storage.getUserByEmail(body.email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValidPassword = await bcrypt.compare(body.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const memberships = await storage.getMembershipsByUserId(user.id);
    if (memberships.length === 0) {
      return res.status(403).json({ message: "No organization membership found" });
    }

    const currentOrgId = memberships[0].orgId;

    const payload = {
      userId: user.id,
      email: user.email,
      currentOrgId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storage.storeRefreshToken(user.id, tokenHash, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const organizations = await Promise.all(
      memberships.map(async (m) => {
        const org = await storage.getOrganizationById(m.orgId);
        return {
          id: m.orgId,
          name: org?.name || "",
          slug: org?.slug || "",
          role: m.role,
        };
      })
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        currentOrgId: currentOrgId,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const storedToken = await storage.getRefreshToken(tokenHash);

    if (!storedToken) {
      return res.status(401).json({ message: "Invalid or revoked refresh token" });
    }

    if (storedToken.expiresAt < new Date()) {
      await storage.revokeRefreshToken(tokenHash);
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const user = await storage.getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    await storage.revokeRefreshToken(tokenHash);

    const newPayload = {
      userId: user.id,
      email: user.email,
      currentOrgId: payload.currentOrgId,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    const newTokenHash = hashToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storage.storeRefreshToken(user.id, newTokenHash, newExpiresAt);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await storage.revokeRefreshToken(tokenHash);
    }
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.name,
        currentOrgId: req.user!.currentOrgId,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const switchOrgSchema = z.object({
  organizationId: z.string(),
});

router.post("/switch-org", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const body = switchOrgSchema.parse(req.body);

    const membership = await storage.getMembershipByUserAndOrg(req.user!.userId, body.organizationId);
    if (!membership) {
      return res.status(403).json({ message: "Not a member of this organization" });
    }

    const oldRefreshToken = req.cookies.refreshToken;
    if (oldRefreshToken) {
      const oldTokenHash = hashToken(oldRefreshToken);
      await storage.revokeRefreshToken(oldTokenHash);
    }

    const payload = {
      userId: req.user!.userId,
      email: req.user!.email,
      currentOrgId: body.organizationId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await storage.storeRefreshToken(req.user!.userId, tokenHash, expiresAt);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const org = await storage.getOrganizationById(body.organizationId);

    const user = await storage.getUserById(req.user!.userId);
    
    res.json({
      user: {
        id: user!.id,
        email: user!.email,
        fullName: user!.name,
        currentOrgId: body.organizationId,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Switch org error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
