import { Response, NextFunction } from "express";
import { db } from "../db";
import { organizations } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { AuthRequest } from "./auth";

export const requireActiveSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.currentOrgId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.user.currentOrgId));

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check if organization is active (not soft-deleted)
    if (!org.isActive) {
      return res.status(403).json({ 
        message: "Organization is inactive",
        code: "ORG_INACTIVE"
      });
    }

    // Check subscription status
    const now = new Date();
    const isTrialActive = org.trialEndsAt && now < org.trialEndsAt;
    const isSubscriptionActive = org.subscriptionStatus === "active";

    if (!isTrialActive && !isSubscriptionActive) {
      return res.status(403).json({
        message: "Subscription required. Your trial has expired.",
        code: "SUBSCRIPTION_REQUIRED",
        trialEnded: org.trialEndsAt,
        subscriptionStatus: org.subscriptionStatus,
      });
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to check trial status and add warning headers
export const checkTrialStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.currentOrgId) {
      return next();
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, req.user.currentOrgId));

    if (org && org.trialEndsAt) {
      const now = new Date();
      const daysLeft = Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0 && daysLeft <= 7) {
        res.setHeader("X-Trial-Days-Left", daysLeft.toString());
        res.setHeader("X-Trial-Expiring", "true");
      }
    }

    next();
  } catch (error) {
    console.error("Trial status check error:", error);
    next(); // Don't block request if this fails
  }
};
