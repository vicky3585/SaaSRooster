import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertTaskSchema } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

router.get("/", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const { assignedTo } = req.query;
    
    let tasks;
    if (assignedTo) {
      tasks = await storage.getTasksByAssignedUser(assignedTo as string, orgId);
    } else {
      tasks = await storage.getTasksByOrg(orgId);
    }
    
    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const task = await storage.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (task.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const validatedData = insertTaskSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
      createdBy: req.user!.userId,
    });
    const task = await storage.createTask(validatedData);
    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Create task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const existingTask = await storage.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (existingTask.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = insertTaskSchema.partial().parse(req.body);
    const task = await storage.updateTask(req.params.id, updates);
    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Update task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const existingTask = await storage.getTaskById(req.params.id);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (existingTask.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const deleted = await storage.deleteTask(req.params.id);
    if (deleted) {
      res.json({ message: "Task deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete task" });
    }
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
