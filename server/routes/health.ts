import { Router } from "express";
import { db } from "../db";

const router = Router();

/**
 * Health check endpoint for Docker and monitoring
 */
router.get("/", async (req, res) => {
  try {
    // Check database connection
    await db.execute("SELECT 1" as any);
    
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: "Database connection failed",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
