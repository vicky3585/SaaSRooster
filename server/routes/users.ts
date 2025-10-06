import { Router, type RequestHandler } from "express";
import { storage } from "../storage";
import { authenticateToken, type AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticateToken as RequestHandler);

router.get("/me/memberships", (async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const memberships = await storage.getMembershipsByUserId(userId);
  
  const membershipsWithOrgs = await Promise.all(
    memberships.map(async (membership) => {
      const organization = await storage.getOrganizationById(membership.orgId);
      return {
        ...membership,
        organization,
      };
    })
  );
  
  res.json(membershipsWithOrgs);
}) as RequestHandler);

export default router;
