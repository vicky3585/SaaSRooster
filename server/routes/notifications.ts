
import { Router, Request, Response } from "express";
import { db } from "../db";
import { notifications, notificationPreferences } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const router = Router();

// Get user notifications
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { unreadOnly, limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let query = db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });

    if (unreadOnly === "true") {
      query = db.query.notifications.findMany({
        where: and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
        orderBy: [desc(notifications.createdAt)],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
    }

    const userNotifications = await query;

    // Get unread count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    res.json({
      notifications: userNotifications,
      unreadCount: count,
    });
  } catch (error: any) {
    console.error("Notifications fetch error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.patch("/:id/read", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark notification as read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// Mark all notifications as read
router.post("/mark-all-read", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark all as read error:", error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// Delete notification
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await db.delete(notifications).where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Get notification preferences
router.get("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, userId),
    });

    // Create default preferences if they don't exist
    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values({ userId })
        .returning();
    }

    res.json(prefs);
  } catch (error: any) {
    console.error("Notification preferences fetch error:", error);
    res.status(500).json({ error: "Failed to fetch notification preferences" });
  }
});

// Update notification preferences
router.patch("/preferences", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const preferences = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const updated = await db
      .update(notificationPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    if (updated.length === 0) {
      // Create if doesn't exist
      const [created] = await db
        .insert(notificationPreferences)
        .values({ userId, ...preferences })
        .returning();
      return res.json(created);
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error("Update notification preferences error:", error);
    res.status(500).json({ error: "Failed to update notification preferences" });
  }
});

// Helper function to create notification
export async function createNotification(data: {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}) {
  try {
    await db.insert(notifications).values(data);
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export default router;
