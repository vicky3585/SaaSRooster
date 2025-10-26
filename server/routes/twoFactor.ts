import { Router, Request, Response } from "express";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { db } from "../db";
import { twoFactorAuth, securityEvents, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Generate 2FA secret and QR code
router.post("/setup", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if 2FA is already enabled
    const existing2FA = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    if (existing2FA?.enabled) {
      return res.status(400).json({ error: "2FA is already enabled" });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Bizverse (${req.user.email})`,
      length: 32,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Encrypt backup codes (in production, use a proper encryption library)
    const encryptedBackupCodes = backupCodes.map((code) =>
      crypto.createHash("sha256").update(code).digest("hex")
    );

    // Store in database (not enabled yet)
    if (existing2FA) {
      await db
        .update(twoFactorAuth)
        .set({
          secret: secret.base32,
          backupCodes: encryptedBackupCodes,
          updatedAt: new Date(),
        })
        .where(eq(twoFactorAuth.userId, userId));
    } else {
      await db.insert(twoFactorAuth).values({
        userId,
        enabled: false,
        method: "totp",
        secret: secret.base32,
        backupCodes: encryptedBackupCodes,
      });
    }

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes, // Return plain backup codes for user to save
    });
  } catch (error: any) {
    console.error("2FA setup error:", error);
    res.status(500).json({ error: "Failed to setup 2FA" });
  }
});

// Verify and enable 2FA
router.post("/enable", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const twoFactorData = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    if (!twoFactorData?.secret) {
      return res.status(400).json({ error: "2FA not set up. Please setup first." });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactorData.secret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Enable 2FA
    await db
      .update(twoFactorAuth)
      .set({
        enabled: true,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(twoFactorAuth.userId, userId));

    // Log security event
    await db.insert(securityEvents).values({
      userId,
      eventType: "2fa_enabled",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      wasSuccessful: true,
    });

    res.json({ success: true, message: "2FA enabled successfully" });
  } catch (error: any) {
    console.error("2FA enable error:", error);
    res.status(500).json({ error: "Failed to enable 2FA" });
  }
});

// Verify 2FA token during login
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const { userId, token, isBackupCode } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const twoFactorData = await db.query.twoFactorAuth.findFirst({
      where: and(eq(twoFactorAuth.userId, userId), eq(twoFactorAuth.enabled, true)),
    });

    if (!twoFactorData) {
      return res.status(400).json({ error: "2FA not enabled" });
    }

    let verified = false;

    if (isBackupCode) {
      // Verify backup code
      const hashedCode = crypto.createHash("sha256").update(token).digest("hex");
      const backupCodes = (twoFactorData.backupCodes || []) as string[];
      verified = backupCodes.includes(hashedCode);

      if (verified) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((code) => code !== hashedCode);
        await db
          .update(twoFactorAuth)
          .set({
            backupCodes: updatedCodes,
            lastUsedAt: new Date(),
          })
          .where(eq(twoFactorAuth.userId, userId));
      }
    } else {
      // Verify TOTP token
      verified = speakeasy.totp.verify({
        secret: twoFactorData.secret!,
        encoding: "base32",
        token,
        window: 2,
      });

      if (verified) {
        await db
          .update(twoFactorAuth)
          .set({ lastUsedAt: new Date() })
          .where(eq(twoFactorAuth.userId, userId));
      }
    }

    // Log security event
    await db.insert(securityEvents).values({
      userId,
      eventType: verified ? "login_success" : "login_failed",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { method: "2fa", isBackupCode },
      wasSuccessful: verified,
    });

    if (verified) {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ error: "Invalid verification code" });
    }
  } catch (error: any) {
    console.error("2FA verification error:", error);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
});

// Disable 2FA
router.post("/disable", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify password (implement password verification based on your auth logic)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Disable 2FA
    await db
      .update(twoFactorAuth)
      .set({
        enabled: false,
        updatedAt: new Date(),
      })
      .where(eq(twoFactorAuth.userId, userId));

    // Log security event
    await db.insert(securityEvents).values({
      userId,
      eventType: "2fa_disabled",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      wasSuccessful: true,
    });

    res.json({ success: true, message: "2FA disabled successfully" });
  } catch (error: any) {
    console.error("2FA disable error:", error);
    res.status(500).json({ error: "Failed to disable 2FA" });
  }
});

// Get 2FA status
router.get("/status", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const twoFactorData = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    res.json({
      enabled: twoFactorData?.enabled || false,
      method: twoFactorData?.method || null,
      lastUsedAt: twoFactorData?.lastUsedAt || null,
      backupCodesRemaining: (twoFactorData?.backupCodes as string[] || []).length,
    });
  } catch (error: any) {
    console.error("2FA status error:", error);
    res.status(500).json({ error: "Failed to get 2FA status" });
  }
});

// Regenerate backup codes
router.post("/regenerate-backup-codes", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    const encryptedBackupCodes = backupCodes.map((code) =>
      crypto.createHash("sha256").update(code).digest("hex")
    );

    await db
      .update(twoFactorAuth)
      .set({
        backupCodes: encryptedBackupCodes,
        updatedAt: new Date(),
      })
      .where(eq(twoFactorAuth.userId, userId));

    res.json({ success: true, backupCodes });
  } catch (error: any) {
    console.error("Backup codes regeneration error:", error);
    res.status(500).json({ error: "Failed to regenerate backup codes" });
  }
});

export default router;
