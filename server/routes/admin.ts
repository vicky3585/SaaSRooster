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

// Create a new organization (admin only)
router.post("/organizations", async (req: any, res) => {
  try {
    const adminId = req.admin.userId;
    
    const createOrgSchema = z.object({
      name: z.string().min(1, "Organization name is required"),
      email: z.string().email("Valid email is required"),
      gstin: z.string().optional(),
      pan: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      planId: z.enum(["free", "basic", "pro", "enterprise"]).default("free"),
      trialDays: z.number().min(0).default(30),
      ownerName: z.string().min(1, "Owner name is required"),
      ownerEmail: z.string().email("Valid owner email is required"),
      ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
    });
    
    const data = createOrgSchema.parse(req.body);
    
    // Check if email already exists
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.email, data.email));
    
    if (existingOrg && existingOrg.status !== "deleted") {
      return res.status(400).json({ message: "Organization with this email already exists" });
    }
    
    // Check if owner email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.ownerEmail));
    
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }
    
    // Generate unique slug
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let slugExists = true;
    let counter = 0;
    let finalSlug = slug;
    
    while (slugExists) {
      const [existing] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, finalSlug));
      
      if (!existing) {
        slugExists = false;
      } else {
        counter++;
        finalSlug = `${slug}-${counter}`;
      }
    }
    
    // Calculate trial end date
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + data.trialDays);
    
    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        name: data.name,
        slug: finalSlug,
        email: data.email,
        gstin: data.gstin || null,
        pan: data.pan || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        planId: data.planId,
        subscriptionStatus: "active",
        status: "active",
        isActive: true,
        trialStartedAt: new Date(),
        trialEndsAt,
      })
      .returning();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.ownerPassword, 10);
    
    // Create owner user
    const [ownerUser] = await db
      .insert(users)
      .values({
        email: data.ownerEmail,
        name: data.ownerName,
        password: hashedPassword,
        role: "org_admin",
      })
      .returning();
    
    // Create membership (owner role)
    await db.insert(memberships).values({
      userId: ownerUser.id,
      orgId: newOrg.id,
      role: "owner",
    });
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "create_organization_by_admin",
      entityType: "organization",
      entityId: newOrg.id,
      changes: {
        organizationName: newOrg.name,
        organizationSlug: newOrg.slug,
        organizationEmail: newOrg.email,
        planId: newOrg.planId,
        trialDays: data.trialDays,
        ownerEmail: data.ownerEmail,
        ownerName: data.ownerName,
        createdAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.status(201).json({
      message: "Organization created successfully",
      organization: {
        id: newOrg.id,
        name: newOrg.name,
        slug: newOrg.slug,
        email: newOrg.email,
        planId: newOrg.planId,
        trialEndsAt: newOrg.trialEndsAt,
      },
      owner: {
        id: ownerUser.id,
        name: ownerUser.name,
        email: ownerUser.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

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
        planId: organizations.planId,
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

// Update organization details (admin only)
router.put("/organizations/:id", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const updateOrgSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      gstin: z.string().optional(),
      pan: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    });
    
    const data = updateOrgSchema.parse(req.body);
    
    // Get current organization
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // If email is being changed, check if it's already in use
    if (data.email && data.email !== org.email) {
      const [existingOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.email, data.email));
      
      if (existingOrg && existingOrg.status !== "deleted") {
        return res.status(400).json({ message: "Organization with this email already exists" });
      }
    }
    
    // Update organization
    const [updatedOrg] = await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning();
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "update_organization_by_admin",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        updatedFields: data,
        updatedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({
      message: "Organization updated successfully",
      organization: updatedOrg,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update organization error:", error);
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

// Change organization subscription plan
router.patch("/organizations/:id/plan", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const { planId } = z.object({
      planId: z.enum(["free", "basic", "pro", "enterprise"]),
    }).parse(req.body);
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    const oldPlanId = org.planId;
    
    // Update organization plan
    await db
      .update(organizations)
      .set({
        planId,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null, // Platform admin action
      action: "change_organization_plan",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        oldPlanId,
        newPlanId: planId,
        changedBy: "platform_admin",
        changedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ 
      message: "Subscription plan updated successfully",
      planId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Change organization plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Extend organization subscription validity
router.patch("/organizations/:id/validity", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const { trialEndsAt } = z.object({
      trialEndsAt: z.string().datetime(),
    }).parse(req.body);
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    const oldTrialEndsAt = org.trialEndsAt;
    const newTrialEndsAt = new Date(trialEndsAt);
    
    // Update organization validity
    await db
      .update(organizations)
      .set({
        trialEndsAt: newTrialEndsAt,
        subscriptionStatus: "active", // Set to active when extending validity
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null, // Platform admin action
      action: "extend_organization_validity",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        oldTrialEndsAt: oldTrialEndsAt?.toISOString() || null,
        newTrialEndsAt: newTrialEndsAt.toISOString(),
        changedBy: "platform_admin",
        changedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ 
      message: "Subscription validity extended successfully",
      trialEndsAt: newTrialEndsAt,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Extend organization validity error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
