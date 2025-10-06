import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { AuthRequest } from "./auth";

export async function validateOrgAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const orgId = req.user?.currentOrgId;
  
  if (!orgId) {
    return res.status(403).json({ message: "Organization context required" });
  }

  const membership = await storage.getMembershipByUserAndOrg(req.user!.userId, orgId);
  
  if (!membership) {
    return res.status(403).json({ message: "Not a member of this organization" });
  }

  req.user!.currentOrgId = orgId;
  next();
}

export async function validateResourceOrg<T extends { orgId: string }>(
  resource: T | null,
  req: AuthRequest,
  res: Response
): Promise<boolean> {
  if (!resource) {
    res.status(404).json({ message: "Resource not found" });
    return false;
  }

  if (resource.orgId !== req.user!.currentOrgId) {
    res.status(403).json({ message: "Access denied: Resource belongs to different organization" });
    return false;
  }

  return true;
}

export async function validateRelatedOrgIds(
  parentOrgId: string,
  relatedEntity: { orgId: string } | null,
  res: Response,
  entityName: string
): Promise<boolean> {
  if (!relatedEntity) {
    res.status(404).json({ message: `${entityName} not found` });
    return false;
  }

  if (relatedEntity.orgId !== parentOrgId) {
    res.status(400).json({ 
      message: `Cross-organization reference detected: ${entityName} belongs to different organization` 
    });
    return false;
  }

  return true;
}
