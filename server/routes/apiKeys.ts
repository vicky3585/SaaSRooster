import { Router, Request, Response } from "express";
import { db } from "../db";
import { apiKeys, apiKeyUsage, securityEvents } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Generate a new API key
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const orgId = req.user?.currentOrgId;
    const { name, permissions, expiresIn } = req.body;

    if (!userId || !orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!name) {
      return res.status(400).json({ error: "API key name is required" });
    }

    // Generate API key
    const apiKey = `bv_live_${crypto.randomBytes(32).toString("hex")}`;
    const keyPrefix = apiKey.substring(0, 15); // "bv_live_xxxxxx"
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Calculate expiration date
    let expiresAt = null;
    if (expiresIn) {
      const daysToAdd = parseInt(expiresIn);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + daysToAdd);
    }

    // Create API key record
    const [newApiKey] = await db
      .insert(apiKeys)
      .values({
        orgId,
        userId,
        name,
        keyPrefix,
        keyHash,
        permissions: permissions || [],
        expiresAt,
        isActive: true,
      })
      .returning();

    // Log security event
    await db.insert(securityEvents).values({
      userId,
      eventType: "api_key_created",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { apiKeyId: newApiKey.id, name },
      wasSuccessful: true,
    });

    res.json({
      success: true,
      apiKey, // Only return full key once
      id: newApiKey.id,
      name: newApiKey.name,
      keyPrefix: newApiKey.keyPrefix,
      permissions: newApiKey.permissions,
      expiresAt: newApiKey.expiresAt,
    });
  } catch (error: any) {
    console.error("API key creation error:", error);
    res.status(500).json({ error: "Failed to create API key" });
  }
});

// Get all API keys for organization
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.currentOrgId;
    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const keys = await db.query.apiKeys.findMany({
      where: eq(apiKeys.orgId, orgId),
      orderBy: [desc(apiKeys.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get usage statistics for each key
    const keysWithStats = await Promise.all(
      keys.map(async (key) => {
        const usageStats = await db
          .select({
            totalRequests: sql<number>`count(*)::int`,
            last7Days: sql<number>`count(*) filter (where created_at > now() - interval '7 days')::int`,
          })
          .from(apiKeyUsage)
          .where(eq(apiKeyUsage.apiKeyId, key.id));

        return {
          ...key,
          stats: usageStats[0] || { totalRequests: 0, last7Days: 0 },
        };
      })
    );

    res.json(keysWithStats);
  } catch (error: any) {
    console.error("API keys fetch error:", error);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
});

// Get API key details with usage
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const key = await db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)),
    });

    if (!key) {
      return res.status(404).json({ error: "API key not found" });
    }

    // Get usage data
    const usageData = await db
      .select({
        endpoint: apiKeyUsage.endpoint,
        method: apiKeyUsage.method,
        count: sql<number>`count(*)::int`,
        avgResponseTime: sql<number>`avg(${apiKeyUsage.responseTime})::int`,
      })
      .from(apiKeyUsage)
      .where(eq(apiKeyUsage.apiKeyId, id))
      .groupBy(apiKeyUsage.endpoint, apiKeyUsage.method)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Get recent usage
    const recentUsage = await db.query.apiKeyUsage.findMany({
      where: eq(apiKeyUsage.apiKeyId, id),
      orderBy: [desc(apiKeyUsage.createdAt)],
      limit: 50,
    });

    res.json({
      ...key,
      usage: {
        byEndpoint: usageData,
        recent: recentUsage,
      },
    });
  } catch (error: any) {
    console.error("API key details fetch error:", error);
    res.status(500).json({ error: "Failed to fetch API key details" });
  }
});

// Update API key
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orgId = req.user?.currentOrgId;
    const { name, permissions } = req.body;

    if (!orgId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updated = await db
      .update(apiKeys)
      .set({
        name,
        permissions,
      })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    res.json({ success: true, apiKey: updated[0] });
  } catch (error: any) {
    console.error("API key update error:", error);
    res.status(500).json({ error: "Failed to update API key" });
  }
});

// Revoke API key
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const orgId = req.user?.currentOrgId;

    if (!orgId || !userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updated = await db
      .update(apiKeys)
      .set({
        isActive: false,
        revokedAt: new Date(),
      })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "API key not found" });
    }

    // Log security event
    await db.insert(securityEvents).values({
      userId,
      eventType: "api_key_revoked",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { apiKeyId: id, name: updated[0].name },
      wasSuccessful: true,
    });

    res.json({ success: true, message: "API key revoked successfully" });
  } catch (error: any) {
    console.error("API key revocation error:", error);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
});

// Log API key usage (middleware will call this)
export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  ipAddress: string,
  userAgent: string
) {
  try {
    await db.insert(apiKeyUsage).values({
      apiKeyId,
      endpoint,
      method,
      statusCode,
      responseTime,
      ipAddress,
      userAgent,
    });

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKeyId));
  } catch (error) {
    console.error("Failed to log API key usage:", error);
  }
}

export default router;
