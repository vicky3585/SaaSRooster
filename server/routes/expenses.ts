import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { insertExpenseSchema } from "@shared/schema";
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
    const expenses = await storage.getExpensesByOrg(orgId);
    res.json(expenses);
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const expense = await storage.getExpenseById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    if (expense.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(expense);
  } catch (error) {
    console.error("Get expense error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const body = insertExpenseSchema.parse({
      ...req.body,
      orgId: req.user!.currentOrgId,
      createdBy: req.user!.userId,
    });
    
    const expense = await storage.createExpense(body);
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Create expense error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const expense = await storage.getExpenseById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    if (expense.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updateSchema = insertExpenseSchema.partial().omit({ orgId: true, createdBy: true });
    const body = updateSchema.parse(req.body);
    
    const updatedExpense = await storage.updateExpense(req.params.id, body);
    res.json(updatedExpense);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors,
      });
    }
    console.error("Update expense error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const expense = await storage.getExpenseById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    
    if (expense.orgId !== req.user!.currentOrgId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const deleted = await storage.deleteExpense(req.params.id);
    
    if (deleted) {
      res.json({ message: "Expense deleted successfully" });
    } else {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  } catch (error) {
    console.error("Delete expense error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
