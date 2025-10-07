import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertMembershipSchema } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const memberships = await storage.getMembershipsByOrg(orgId);
    
    const membershipsWithUsers = await Promise.all(
      memberships.map(async (membership) => {
        const user = await storage.getUserById(membership.userId);
        return {
          ...membership,
          user: user ? {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
          } : null,
        };
      })
    );
    
    res.json(membershipsWithUsers);
  } catch (error) {
    console.error("Get memberships error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/invite", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const currentMembership = await storage.getMembershipByUserAndOrg(req.user!.userId, orgId);
    
    if (!currentMembership || (currentMembership.role !== "owner" && currentMembership.role !== "admin")) {
      return res.status(403).json({ message: "Only owners and admins can invite members" });
    }
    
    const { email, role } = z.object({
      email: z.string().email(),
      role: z.enum(["admin", "accountant", "viewer"]),
    }).parse(req.body);
    
    const existingUser = await storage.getUserByEmail(email);
    
    if (!existingUser) {
      return res.status(404).json({ 
        message: "User not found. The user must sign up first before being invited." 
      });
    }
    
    const existingMembership = await storage.getMembershipByUserAndOrg(existingUser.id, orgId);
    
    if (existingMembership) {
      return res.status(400).json({ message: "User is already a member of this organization" });
    }
    
    const membership = await storage.createMembership({
      userId: existingUser.id,
      orgId,
      role,
    });
    
    const user = await storage.getUserById(membership.userId);
    
    res.status(201).json({
      ...membership,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      } : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Invite member error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id/role", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const currentMembership = await storage.getMembershipByUserAndOrg(req.user!.userId, orgId);
    
    if (!currentMembership || (currentMembership.role !== "owner" && currentMembership.role !== "admin")) {
      return res.status(403).json({ message: "Only owners and admins can update member roles" });
    }
    
    const membership = await storage.getMembershipById(req.params.id);
    
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }
    
    if (membership.orgId !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (membership.role === "owner") {
      return res.status(403).json({ message: "Cannot change owner role" });
    }
    
    const { role } = z.object({
      role: z.enum(["admin", "accountant", "viewer"]),
    }).parse(req.body);
    
    const updatedMembership = await storage.updateMembershipRole(membership.id, role);
    
    const user = await storage.getUserById(membership.userId);
    
    res.json({
      ...updatedMembership,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      } : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update role error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }
    
    const currentMembership = await storage.getMembershipByUserAndOrg(req.user!.userId, orgId);
    
    if (!currentMembership || (currentMembership.role !== "owner" && currentMembership.role !== "admin")) {
      return res.status(403).json({ message: "Only owners and admins can remove members" });
    }
    
    const memberships = await storage.getMembershipsByOrg(orgId);
    const membership = memberships.find(m => m.id === req.params.id);
    
    if (!membership) {
      return res.status(404).json({ message: "Membership not found" });
    }
    
    if (membership.orgId !== orgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (membership.role === "owner") {
      return res.status(403).json({ message: "Cannot remove owner" });
    }
    
    const deleted = await storage.deleteMembership(req.params.id);
    
    if (deleted) {
      res.json({ message: "Member removed successfully" });
    } else {
      res.status(500).json({ message: "Failed to remove member" });
    }
  } catch (error) {
    console.error("Remove member error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
