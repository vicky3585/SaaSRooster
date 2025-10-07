import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { storage } from "../storage";
import { requirePlatformAdmin } from "../middleware/platformAdmin";
import { db } from "../db";
import { organizations, memberships, users, auditLogs } from "@shared/schema";
import { eq, count, isNull } from "drizzle-orm";

const router = Router();

router.use(requirePlatformAdmin);

// Get all organizations with member counts
router.get("/organizations", async (req: any, res) => {
  try {
    const orgs = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        gstin: organizations.gstin,
        status: organizations.status,
        subscriptionStatus: organizations.subscriptionStatus,
        trialEndsAt: organizations.trialEndsAt,
        createdAt: organizations.createdAt,
      })
      .from(organizations);

    // Get member counts for each organization
    const orgsWithCounts = await Promise.all(
      orgs.map(async (org) => {
        const [result] = await db
          .select({ count: count() })
          .from(memberships)
          .where(eq(memberships.orgId, org.id));
        
        return {
          ...org,
          memberCount: result.count,
        };
      })
    );

    res.json(orgsWithCounts);
  } catch (error) {
    console.error("Get all organizations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Soft-delete an organization (marks as deleted)
router.delete("/organizations/:id", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    // Get organization details before deletion
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Soft delete - mark status as deleted
    await db
      .update(organizations)
      .set({
        status: "deleted",
        isActive: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null, // Platform admin action
      action: "soft_delete_organization",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        organizationSlug: org.slug,
        status: "deleted",
        deletedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Soft delete organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Disable an organization
router.post("/organizations/:id/disable", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Disable organization
    await db
      .update(organizations)
      .set({
        status: "disabled",
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "disable_organization",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        status: "disabled",
        disabledAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Organization disabled successfully" });
  } catch (error) {
    console.error("Disable organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Enable an organization
router.post("/organizations/:id/enable", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Enable organization
    await db
      .update(organizations)
      .set({
        status: "active",
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "enable_organization",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        status: "active",
        enabledAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Organization enabled successfully" });
  } catch (error) {
    console.error("Enable organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get organization users
router.get("/organizations/:id/users", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    
    const orgMemberships = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        role: memberships.role,
        createdAt: memberships.createdAt,
        userName: users.name,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .where(eq(memberships.orgId, orgId));
    
    res.json(orgMemberships);
  } catch (error) {
    console.error("Get organization users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Reset user password (admin)
router.post("/users/:userId/reset-password", async (req: any, res) => {
  try {
    const userId = req.params.userId;
    const adminId = req.admin.userId;
    
    const { newPassword } = z.object({
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
    }).parse(req.body);
    
    const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_reset_user_password",
      entityType: "user",
      entityId: userId,
      changes: {
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
        resetBy: "platform_admin",
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Admin reset password error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
