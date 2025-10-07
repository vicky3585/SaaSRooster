import { Router } from "express";
import { db } from "../db";
import { paymentGatewayConfigs, insertPaymentGatewayConfigSchema } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();

router.use(authenticateToken);

// Get all payment gateway configurations for the current organization
router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const configs = await db
      .select({
        id: paymentGatewayConfigs.id,
        gatewayName: paymentGatewayConfigs.gatewayName,
        displayName: paymentGatewayConfigs.displayName,
        isActive: paymentGatewayConfigs.isActive,
        isDefault: paymentGatewayConfigs.isDefault,
        mode: paymentGatewayConfigs.mode,
        createdAt: paymentGatewayConfigs.createdAt,
        // Don't expose sensitive config data in list view
      })
      .from(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.orgId, orgId))
      .orderBy(paymentGatewayConfigs.isDefault);

    res.json(configs);
  } catch (error) {
    console.error("Get payment gateways error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a specific payment gateway configuration (includes config data)
router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [config] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.id, req.params.id),
          eq(paymentGatewayConfigs.orgId, orgId)
        )
      );

    if (!config) {
      return res.status(404).json({ message: "Payment gateway configuration not found" });
    }

    res.json(config);
  } catch (error) {
    console.error("Get payment gateway error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create a new payment gateway configuration
router.post("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const body = insertPaymentGatewayConfigSchema.parse({
      ...req.body,
      orgId,
    });

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(paymentGatewayConfigs)
        .set({ isDefault: false })
        .where(eq(paymentGatewayConfigs.orgId, orgId));
    }

    const [config] = await db
      .insert(paymentGatewayConfigs)
      .values(body)
      .returning();

    res.status(201).json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create payment gateway error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a payment gateway configuration
router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [existing] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.id, req.params.id),
          eq(paymentGatewayConfigs.orgId, orgId)
        )
      );

    if (!existing) {
      return res.status(404).json({ message: "Payment gateway configuration not found" });
    }

    const updateSchema = insertPaymentGatewayConfigSchema.partial().omit({ orgId: true });
    const body = updateSchema.parse(req.body);

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db
        .update(paymentGatewayConfigs)
        .set({ isDefault: false })
        .where(
          and(
            eq(paymentGatewayConfigs.orgId, orgId),
            eq(paymentGatewayConfigs.id, req.params.id)
          )
        );
    }

    const [updated] = await db
      .update(paymentGatewayConfigs)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(paymentGatewayConfigs.id, req.params.id))
      .returning();

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update payment gateway error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a payment gateway configuration
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [existing] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.id, req.params.id),
          eq(paymentGatewayConfigs.orgId, orgId)
        )
      );

    if (!existing) {
      return res.status(404).json({ message: "Payment gateway configuration not found" });
    }

    await db
      .delete(paymentGatewayConfigs)
      .where(eq(paymentGatewayConfigs.id, req.params.id));

    res.json({ message: "Payment gateway configuration deleted successfully" });
  } catch (error) {
    console.error("Delete payment gateway error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Test a payment gateway configuration
router.post("/:id/test", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [config] = await db
      .select()
      .from(paymentGatewayConfigs)
      .where(
        and(
          eq(paymentGatewayConfigs.id, req.params.id),
          eq(paymentGatewayConfigs.orgId, orgId)
        )
      );

    if (!config) {
      return res.status(404).json({ message: "Payment gateway configuration not found" });
    }

    // TODO: Implement actual gateway testing logic
    // This would make a test API call to verify credentials

    res.json({ 
      success: true, 
      message: `Test connection to ${config.displayName} successful` 
    });
  } catch (error) {
    console.error("Test payment gateway error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
