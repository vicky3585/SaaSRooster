
import { Router, Request, Response } from "express";
import { db } from "../db";
import { webhooks, webhookLogs } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Create webhook
router.post("/", async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.currentOrgId;
    const { url, events, description, headers, retryCount } = req.body;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!url || !events || events.length === 0) {
      return res.status(400).json({ error: "URL and events are required" });
    }

    // Generate webhook secret for HMAC signatures
    const secret = `whsec_${crypto.randomBytes(32).toString("hex")}`;

    const [webhook] = await db
      .insert(webhooks)
      .values({
        orgId,
        url,
        events,
        secret,
        description,
        headers: headers || {},
        retryCount: retryCount || 3,
        isActive: true,
      })
      .returning();

    res.json({ success: true, webhook });
  } catch (error: any) {
    console.error("Webhook creation error:", error);
    res.status(500).json({ error: "Failed to create webhook" });
  }
});

// Get all webhooks
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.currentOrgId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const allWebhooks = await db.query.webhooks.findMany({
      where: eq(webhooks.orgId, orgId),
      orderBy: [desc(webhooks.createdAt)],
    });

    res.json(allWebhooks);
  } catch (error: any) {
    console.error("Webhooks fetch error:", error);
    res.status(500).json({ error: "Failed to fetch webhooks" });
  }
});

// Get webhook details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const webhook = await db.query.webhooks.findFirst({
      where: and(eq(webhooks.id, id), eq(webhooks.orgId, orgId)),
    });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // Get recent logs
    const logs = await db.query.webhookLogs.findMany({
      where: eq(webhookLogs.webhookId, id),
      orderBy: [desc(webhookLogs.createdAt)],
      limit: 50,
    });

    res.json({ ...webhook, logs });
  } catch (error: any) {
    console.error("Webhook details fetch error:", error);
    res.status(500).json({ error: "Failed to fetch webhook details" });
  }
});

// Update webhook
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;
    const { url, events, description, headers, retryCount, isActive } = req.body;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updated = await db
      .update(webhooks)
      .set({
        url,
        events,
        description,
        headers,
        retryCount,
        isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(webhooks.id, id), eq(webhooks.orgId, orgId)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    res.json({ success: true, webhook: updated[0] });
  } catch (error: any) {
    console.error("Webhook update error:", error);
    res.status(500).json({ error: "Failed to update webhook" });
  }
});

// Delete webhook
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db.delete(webhooks).where(and(eq(webhooks.id, id), eq(webhooks.orgId, orgId)));

    res.json({ success: true, message: "Webhook deleted successfully" });
  } catch (error: any) {
    console.error("Webhook deletion error:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// Test webhook
router.post("/:id/test", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const webhook = await db.query.webhooks.findFirst({
      where: and(eq(webhooks.id, id), eq(webhooks.orgId, orgId)),
    });

    if (!webhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // Send test payload
    const testPayload = {
      event: "webhook.test",
      timestamp: new Date().toISOString(),
      data: { message: "This is a test webhook from Bizverse" },
    };

    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(JSON.stringify(testPayload))
      .digest("hex");

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        ...(webhook.headers as Record<string, string>),
      },
      body: JSON.stringify(testPayload),
    });

    const statusCode = response.status;
    const responseBody = await response.text();

    // Log the test
    await db.insert(webhookLogs).values({
      webhookId: id,
      event: "webhook.test",
      payload: testPayload,
      status: statusCode >= 200 && statusCode < 300 ? "success" : "failed",
      statusCode,
      responseBody,
      attemptCount: 1,
    });

    res.json({
      success: statusCode >= 200 && statusCode < 300,
      statusCode,
      responseBody,
    });
  } catch (error: any) {
    console.error("Webhook test error:", error);
    res.status(500).json({ error: "Failed to test webhook" });
  }
});

export default router;
