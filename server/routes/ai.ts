import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";
import {
  generateItemDescription,
  suggestHSNCode,
  suggestTaxRate,
  analyzeInvoice,
} from "../services/invoiceAI";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

// Generate item description
router.post("/generate-description", async (req: AuthRequest, res) => {
  try {
    const { itemName } = req.body;
    
    if (!itemName) {
      return res.status(400).json({ message: "Item name is required" });
    }
    
    const description = await generateItemDescription(itemName);
    res.json({ description });
  } catch (error) {
    console.error("Generate description error:", error);
    res.status(500).json({ message: "Failed to generate description" });
  }
});

// Suggest HSN/SAC code
router.post("/suggest-hsn", async (req: AuthRequest, res) => {
  try {
    const { itemDescription } = req.body;
    
    if (!itemDescription) {
      return res.status(400).json({ message: "Item description is required" });
    }
    
    const suggestion = await suggestHSNCode(itemDescription);
    res.json(suggestion);
  } catch (error) {
    console.error("Suggest HSN error:", error);
    res.status(500).json({ message: "Failed to suggest HSN code" });
  }
});

// Suggest tax rate
router.post("/suggest-tax-rate", async (req: AuthRequest, res) => {
  try {
    const { itemDescription } = req.body;
    
    if (!itemDescription) {
      return res.status(400).json({ message: "Item description is required" });
    }
    
    const taxRate = await suggestTaxRate(itemDescription);
    res.json({ taxRate });
  } catch (error) {
    console.error("Suggest tax rate error:", error);
    res.status(500).json({ message: "Failed to suggest tax rate" });
  }
});

// Analyze invoice
router.post("/analyze-invoice", async (req: AuthRequest, res) => {
  try {
    const { customer, items, subtotal, total } = req.body;
    
    if (!customer || !items || !subtotal || !total) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    const analysis = await analyzeInvoice({ customer, items, subtotal, total });
    res.json(analysis);
  } catch (error) {
    console.error("Analyze invoice error:", error);
    res.status(500).json({ message: "Failed to analyze invoice" });
  }
});

export default router;
