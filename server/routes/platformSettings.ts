import { Router } from "express";
import { db } from "../db";
import { platformSettings, insertPlatformSettingSchema } from "@shared/schema";
import { requirePlatformAdmin } from "../middleware/platformAdmin";
import { eq } from "drizzle-orm";

const router = Router();

// All routes require platform admin
router.use(requirePlatformAdmin);

// Get all settings
router.get("/", async (req, res) => {
  try {
    const settings = await db.select().from(platformSettings);
    
    // Convert array to key-value object for easier frontend use
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
    
    res.json(settingsObject);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Get setting by key
router.get("/:key", async (req, res) => {
  try {
    const [setting] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, req.params.key));

    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.json(setting);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Set or update setting
router.post("/", async (req, res) => {
  try {
    const { key, value, description } = req.body;
    
    if (!key) {
      return res.status(400).json({ message: "Key is required" });
    }

    // Try to update first
    const [existing] = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, key));

    if (existing) {
      const [updated] = await db
        .update(platformSettings)
        .set({ value, description, updatedAt: new Date() })
        .where(eq(platformSettings.key, key))
        .returning();
      
      return res.json(updated);
    }

    // Create new if doesn't exist
    const [created] = await db
      .insert(platformSettings)
      .values({ key, value, description })
      .returning();

    res.status(201).json(created);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete setting
router.delete("/:key", async (req, res) => {
  try {
    const [deleted] = await db
      .delete(platformSettings)
      .where(eq(platformSettings.key, req.params.key))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Setting not found" });
    }

    res.json({ message: "Setting deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
