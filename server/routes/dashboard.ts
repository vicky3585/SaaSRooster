import { Router } from "express";
import { db } from "../db";
import { invoices, customers, expenses, stockTransactions, items } from "@shared/schema";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { validateOrgAccess } from "../middleware/orgIsolation";
import { eq, and, sql, gte, lte, desc } from "drizzle-orm";
import { subDays, format } from "date-fns";

const router = Router();

router.use(authenticateToken);
router.use(validateOrgAccess);

// Get dashboard statistics
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    // Get amount outstanding (unpaid invoices)
    const [amountOutstandingResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          sql`${invoices.status} IN ('sent', 'overdue', 'partial')`
        )
      );

    // Get unpaid invoices count
    const [unpaidInvoicesResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          sql`${invoices.status} IN ('sent', 'overdue', 'partial')`
        )
      );

    // Get draft invoices as "open quotations"
    const [openQuotationsResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          eq(invoices.status, "draft")
        )
      );

    // Get unpaid purchases (expenses)
    const [unpaidPurchasesResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(eq(expenses.orgId, orgId));

    res.json({
      amountOutstanding: Math.round(Number(amountOutstandingResult?.total || 0)),
      unpaidInvoices: Number(unpaidInvoicesResult?.count || 0),
      openQuotations: Number(openQuotationsResult?.count || 0),
      unpaidPurchases: Number(unpaidPurchasesResult?.count || 0),
      staffPresent: 0, // This would require a staff/attendance module
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get revenue chart data
router.get("/revenue-chart", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const days = parseInt(req.query.days as string) || 30;
    const startDate = subDays(new Date(), days);

    const revenueData = await db
      .select({
        date: sql<string>`DATE(${invoices.invoiceDate})`,
        amount: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          gte(invoices.invoiceDate, startDate),
          sql`${invoices.status} IN ('sent', 'paid', 'partial')`
        )
      )
      .groupBy(sql`DATE(${invoices.invoiceDate})`)
      .orderBy(sql`DATE(${invoices.invoiceDate})`);

    const formattedData = revenueData.map(row => ({
      date: format(new Date(row.date), 'dd MMM'),
      amount: Math.round(Number(row.amount)),
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Get revenue chart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get invoice distribution
router.get("/invoice-distribution", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    const [paidCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(and(eq(invoices.orgId, orgId), eq(invoices.status, "paid")));

    const [overdueCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(and(eq(invoices.orgId, orgId), eq(invoices.status, "overdue")));

    const [dueCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          sql`${invoices.status} IN ('sent', 'partial')`
        )
      );

    res.json([
      { status: "Paid", value: Number(paidCount?.count || 0), fill: "hsl(var(--chart-1))" },
      { status: "Overdue", value: Number(overdueCount?.count || 0), fill: "hsl(var(--chart-2))" },
      { status: "Due", value: Number(dueCount?.count || 0), fill: "hsl(var(--chart-3))" },
    ]);
  } catch (error) {
    console.error("Get invoice distribution error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get recent activities
router.get("/recent-activities", async (req: AuthRequest, res) => {
  try {
    const orgId = req.user!.currentOrgId;
    if (!orgId) {
      return res.status(400).json({ message: "No organization selected" });
    }

    // Get customer due amount
    const [customerDue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          sql`${invoices.status} IN ('sent', 'overdue', 'partial')`
        )
      );

    // Get supplier due (expenses)
    const [supplierDue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${expenses.total} AS NUMERIC)), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.orgId, orgId));

    // Get amount received (last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const [amountReceived] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${invoices.total} AS NUMERIC)), 0)`,
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.orgId, orgId),
          eq(invoices.status, "paid"),
          gte(invoices.invoiceDate, thirtyDaysAgo)
        )
      );

    // Get amount paid (last 30 days)
    const [amountPaid] = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${expenses.total} AS NUMERIC)), 0)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.orgId, orgId),
          gte(expenses.expenseDate, thirtyDaysAgo)
        )
      );

    const activities = [
      {
        type: "Customer Due",
        description: `₹${Math.round(Number(customerDue?.total || 0)).toLocaleString('en-IN')}`,
        time: "All",
        status: Number(customerDue?.total || 0) > 0 ? "overdue" : "success",
      },
      {
        type: "Supplier Due",
        description: `₹${Math.round(Number(supplierDue?.total || 0)).toLocaleString('en-IN')}`,
        time: "All",
        status: Number(supplierDue?.total || 0) > 0 ? "pending" : "success",
      },
      {
        type: "Amount Received",
        description: `₹${Math.round(Number(amountReceived?.total || 0)).toLocaleString('en-IN')}`,
        time: "Last 30 days",
        status: "success",
      },
      {
        type: "Amount Paid",
        description: `₹${Math.round(Number(amountPaid?.total || 0)).toLocaleString('en-IN')}`,
        time: "Last 30 days",
        status: "success",
      },
    ];

    res.json(activities);
  } catch (error) {
    console.error("Get recent activities error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
