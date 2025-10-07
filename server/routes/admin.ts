import { Router } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { organizations, memberships, users } from "@shared/schema";
import { eq, count } from "drizzle-orm";

const router = Router();

// Middleware to check super admin status
const requireSuperAdmin = async (req: AuthRequest, res: any, next: any) => {
  try {
    const userId = req.user!.userId;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({ message: "Super admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Super admin check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

router.use(authenticateToken);
router.use(requireSuperAdmin);

// Get all organizations with member counts
router.get("/organizations", async (req: AuthRequest, res) => {
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

// Delete an organization (cascades to all related data)
router.delete("/organizations/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.params.id;
    
    // Delete the organization (cascade will handle related data)
    await db.delete(organizations).where(eq(organizations.id, orgId));
    
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Delete organization error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
