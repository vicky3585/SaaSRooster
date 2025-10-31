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

// Create a new organization
router.post("/organizations", async (req: any, res) => {
  try {
    const adminId = req.admin.userId;
    
    const createOrgSchema = z.object({
      name: z.string().min(1, "Organization name is required"),
      ownerEmail: z.string().email("Invalid email address"),
      ownerName: z.string().min(1, "Owner name is required"),
      ownerPassword: z.string().min(6, "Password must be at least 6 characters"),
      email: z.string().email("Invalid email").optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      pincode: z.string().length(6).optional().nullable(),
      gstin: z.string().length(15).optional().nullable(),
      pan: z.string().length(10).optional().nullable(),
      planId: z.enum(["free", "basic", "pro", "enterprise", "starter", "professional"]).default("free"),
      validityDays: z.number().int().min(1).default(30),
    });
    
    const orgData = createOrgSchema.parse(req.body);
    
    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(orgData.ownerEmail);
    
    if (existingUser) {
      return res.status(400).json({ 
        message: "A user with this email already exists. Please use a different email or add them to an existing organization." 
      });
    }
    
    // Generate unique slug from organization name
    const baseSlug = orgData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure slug is unique
    while (true) {
      const [existing] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);
      
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Create organization
    const [newOrg] = await db.insert(organizations).values({
      name: orgData.name,
      slug,
      email: orgData.email,
      phone: orgData.phone,
      address: orgData.address,
      city: orgData.city,
      state: orgData.state,
      pincode: orgData.pincode,
      gstin: orgData.gstin,
      pan: orgData.pan,
      planId: orgData.planId,
      subscriptionStatus: "active",
      subscriptionExpiresAt: new Date(Date.now() + orgData.validityDays * 24 * 60 * 60 * 1000),
      status: "active",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(orgData.ownerPassword, 10);
    
    // Create owner user
    const [newUser] = await db.insert(users).values({
      name: orgData.ownerName,
      email: orgData.ownerEmail,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Create membership linking user as owner
    await db.insert(memberships).values({
      userId: newUser.id,
      orgId: newOrg.id,
      role: "owner",
      createdAt: new Date(),
    });
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_create_organization",
      entityType: "organization",
      entityId: newOrg.id,
      changes: {
        organizationName: newOrg.name,
        ownerEmail: orgData.ownerEmail,
        ownerName: orgData.ownerName,
        planId: orgData.planId,
        validityDays: orgData.validityDays,
        createdAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.status(201).json({
      message: "Organization created successfully",
      organization: newOrg,
      owner: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
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
        email: organizations.email,
        phone: organizations.phone,
        address: organizations.address,
        city: organizations.city,
        state: organizations.state,
        pincode: organizations.pincode,
        gstin: organizations.gstin,
        status: organizations.status,
        subscriptionStatus: organizations.subscriptionStatus,
        subscriptionExpiresAt: organizations.subscriptionExpiresAt,
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

// Update organization details
router.patch("/organizations/:id", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const updateSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional().nullable(),
      phone: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      pincode: z.string().length(6).optional().nullable(),
      gstin: z.string().length(15).optional().nullable(),
    });
    
    const updates = updateSchema.parse(req.body);
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Update organization
    await db
      .update(organizations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_update_organization",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        updates: updates,
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Organization updated successfully" });
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

// Change subscription plan
router.post("/organizations/:id/change-plan", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const { planId } = z.object({
      planId: z.enum(["free", "basic", "pro", "enterprise", "starter", "professional"]),
    }).parse(req.body);
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    const oldPlan = org.planId;
    
    // Update plan
    await db
      .update(organizations)
      .set({
        planId: planId,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_change_subscription_plan",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        oldPlan: oldPlan,
        newPlan: planId,
        changedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Subscription plan changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Change subscription plan error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Extend validity/expiry date
router.post("/organizations/:id/extend-validity", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const { expiryDate } = z.object({
      expiryDate: z.string().datetime(),
    }).parse(req.body);
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    const oldExpiryDate = org.subscriptionExpiresAt;
    const newExpiryDate = new Date(expiryDate);
    
    // Update expiry date
    await db
      .update(organizations)
      .set({
        subscriptionExpiresAt: newExpiryDate,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_extend_subscription_validity",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        oldExpiryDate: oldExpiryDate?.toISOString() || null,
        newExpiryDate: newExpiryDate.toISOString(),
        extendedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Subscription validity extended successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Extend validity error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new user in an organization
router.post("/organizations/:orgId/users", async (req: any, res) => {
  try {
    const orgId = req.params.orgId;
    const adminId = req.admin.userId;
    
    const createUserSchema = z.object({
      name: z.string().min(1, "User name is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["owner", "admin", "staff"]).default("staff"),
      phone: z.string().optional().nullable(),
    });
    
    const userData = createUserSchema.parse(req.body);
    
    // Check if organization exists
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Check if user with this email already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    
    if (existingUser) {
      // Check if user is already a member of this organization
      const existingMembership = await storage.getMembershipByUserAndOrg(existingUser.id, orgId);
      
      if (existingMembership) {
        return res.status(400).json({ 
          message: "This user is already a member of this organization" 
        });
      }
      
      // User exists but not in this org - create membership
      await db.insert(memberships).values({
        userId: existingUser.id,
        orgId: orgId,
        role: userData.role,
        createdAt: new Date(),
      });
      
      // Create audit log
      await db.insert(auditLogs).values({
        userId: adminId,
        orgId: null,
        action: "admin_add_existing_user_to_organization",
        entityType: "membership",
        entityId: existingUser.id,
        changes: {
          organizationName: org.name,
          userName: existingUser.name,
          userEmail: existingUser.email,
          role: userData.role,
          addedAt: new Date().toISOString(),
        },
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      
      return res.status(201).json({
        message: "Existing user added to organization successfully",
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: userData.role,
        },
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create new user
    const [newUser] = await db.insert(users).values({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      phone: userData.phone,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Create membership linking user to organization
    await db.insert(memberships).values({
      userId: newUser.id,
      orgId: orgId,
      role: userData.role,
      createdAt: new Date(),
    });
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_create_user_in_organization",
      entityType: "user",
      entityId: newUser.id,
      changes: {
        organizationName: org.name,
        userName: newUser.name,
        userEmail: newUser.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: userData.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Edit user details
router.patch("/users/:userId", async (req: any, res) => {
  try {
    const userId = req.params.userId;
    const adminId = req.admin.userId;
    
    const updateUserSchema = z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional().nullable(),
    });
    
    const updates = updateUserSchema.parse(req.body);
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // If email is being updated, check if it's already taken
    if (updates.email && updates.email !== user.email) {
      const existingUser = await storage.getUserByEmail(updates.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }
    
    // Update user
    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_update_user",
      entityType: "user",
      entityId: userId,
      changes: {
        oldData: {
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        newData: updates,
        updatedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "User updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Change user role in an organization
router.patch("/organizations/:orgId/users/:userId/role", async (req: any, res) => {
  try {
    const { orgId, userId } = req.params;
    const adminId = req.admin.userId;
    
    const { role } = z.object({
      role: z.enum(["owner", "admin", "staff"]),
    }).parse(req.body);
    
    // Get the membership
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .where(eq(memberships.orgId, orgId));
    
    if (!membership) {
      return res.status(404).json({ message: "User membership not found" });
    }
    
    const oldRole = membership.role;
    
    // Update role
    await db
      .update(memberships)
      .set({
        role: role,
        updatedAt: new Date(),
      })
      .where(eq(memberships.id, membership.id));
    
    // Get user and org details for audit log
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_change_user_role",
      entityType: "membership",
      entityId: membership.id,
      changes: {
        organizationName: org?.name,
        userName: user?.name,
        userEmail: user?.email,
        oldRole: oldRole,
        newRole: role,
        changedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "User role updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Change user role error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete user from organization
router.delete("/organizations/:orgId/users/:userId", async (req: any, res) => {
  try {
    const { orgId, userId } = req.params;
    const adminId = req.admin.userId;
    
    // Get the membership details
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, userId))
      .where(eq(memberships.orgId, orgId));
    
    if (!membership) {
      return res.status(404).json({ message: "User membership not found" });
    }
    
    // Check if this is the last admin/owner
    if (membership.role === "owner" || membership.role === "admin") {
      const [adminCount] = await db
        .select({ count: count() })
        .from(memberships)
        .where(eq(memberships.orgId, orgId));
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ 
          message: "Cannot delete the last user of the organization" 
        });
      }
    }
    
    // Get user details for audit log
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    // Delete the membership
    await db
      .delete(memberships)
      .where(eq(memberships.id, membership.id));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "admin_delete_user_from_organization",
      entityType: "membership",
      entityId: membership.id,
      changes: {
        organizationName: org?.name,
        userName: user?.name,
        userEmail: user?.email,
        role: membership.role,
        deletedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "User removed from organization successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
