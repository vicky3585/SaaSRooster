import { Router } from "express";
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

// Soft-delete an organization (marks as inactive instead of hard delete)
router.delete("/organizations/:id", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    // Get organization details before deletion
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Soft delete - mark as inactive
    await db
      .update(organizations)
      .set({
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
        deletedAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Organization deactivated successfully" });
  } catch (error) {
    console.error("Soft delete organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Restore a soft-deleted organization
router.post("/organizations/:id/restore", async (req: any, res) => {
  try {
    const orgId = req.params.id;
    const adminId = req.admin.userId;
    
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Restore organization
    await db
      .update(organizations)
      .set({
        isActive: true,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));
    
    // Create audit log
    await db.insert(auditLogs).values({
      userId: adminId,
      orgId: null,
      action: "restore_organization",
      entityType: "organization",
      entityId: orgId,
      changes: {
        organizationName: org.name,
        restoredAt: new Date().toISOString(),
      },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ message: "Organization restored successfully" });
  } catch (error) {
    console.error("Restore organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
