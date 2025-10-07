import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import customersRoutes from "./routes/customers";
import invoicesRoutes from "./routes/invoices";
import warehousesRoutes from "./routes/warehouses";
import itemsRoutes from "./routes/items";
import stockTransactionsRoutes from "./routes/stockTransactions";
import expensesRoutes from "./routes/expenses";
import membershipsRoutes from "./routes/memberships";
import organizationsRoutes from "./routes/organizations";
import leadsRoutes from "./routes/leads";
import dealsRoutes from "./routes/deals";
import activitiesRoutes from "./routes/activities";
import tasksRoutes from "./routes/tasks";
import accountsRoutes from "./routes/accounts";
import contactsRoutes from "./routes/contacts";
import dealStagesRoutes from "./routes/dealStages";
import chartOfAccountsRoutes from "./routes/chartOfAccounts";
import journalsRoutes from "./routes/journals";
import ticketsRoutes from "./routes/tickets";
import teamsRoutes from "./routes/teams";
import notesRoutes from "./routes/notes";
import attachmentsRoutes from "./routes/attachments";
import recurringInvoicesRoutes from "./routes/recurringInvoices";
import searchRoutes from "./routes/search";
import unitsRoutes from "./routes/units";
import gstRatesRoutes from "./routes/gstRates";
import orgGstinsRoutes from "./routes/orgGstins";
import financialYearsRoutes from "./routes/financialYears";
import vendorsRoutes from "./routes/vendors";
import priceListsRoutes from "./routes/priceLists";
import aiRoutes from "./routes/ai";
import dashboardRoutes from "./routes/dashboard";
import adminRoutes from "./routes/admin";
import adminAuthRoutes from "./routes/adminAuth";
import subscriptionPlansRoutes from "./routes/subscriptionPlans";
import platformSettingsRoutes from "./routes/platformSettings";
import paymentGatewaysRoutes from "./routes/paymentGateways";
import { requireActiveSubscription, checkTrialStatus } from "./middleware/subscription";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  
  // Admin routes (no subscription check)
  app.use("/api/admin/auth", adminAuthRoutes);
  app.use("/api/admin/subscription-plans", subscriptionPlansRoutes);
  app.use("/api/admin/settings", platformSettingsRoutes);
  app.use("/api/admin", adminRoutes);
  
  // Auth routes (no subscription check for login/signup)
  app.use("/api/auth", authRoutes);
  
  // Apply trial status checker to all org routes
  app.use("/api", checkTrialStatus);
  
  // Protected org routes with subscription requirement
  app.use("/api/dashboard", requireActiveSubscription, dashboardRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/customers", requireActiveSubscription, customersRoutes);
  app.use("/api/vendors", requireActiveSubscription, vendorsRoutes);
  app.use("/api/invoices", requireActiveSubscription, invoicesRoutes);
  app.use("/api/warehouses", requireActiveSubscription, warehousesRoutes);
  app.use("/api/items", requireActiveSubscription, itemsRoutes);
  app.use("/api/stock-transactions", requireActiveSubscription, stockTransactionsRoutes);
  app.use("/api/expenses", requireActiveSubscription, expensesRoutes);
  app.use("/api/memberships", membershipsRoutes); // No subscription check for memberships
  app.use("/api/organizations", organizationsRoutes); // No subscription check for org management
  app.use("/api/payment-gateways", requireActiveSubscription, paymentGatewaysRoutes);
  app.use("/api/org-gstins", requireActiveSubscription, orgGstinsRoutes);
  app.use("/api/financial-years", requireActiveSubscription, financialYearsRoutes);
  app.use("/api/units", requireActiveSubscription, unitsRoutes);
  app.use("/api/gst-rates", requireActiveSubscription, gstRatesRoutes);
  app.use("/api/price-lists", requireActiveSubscription, priceListsRoutes);
  app.use("/api/leads", requireActiveSubscription, leadsRoutes);
  app.use("/api/deals", requireActiveSubscription, dealsRoutes);
  app.use("/api/activities", requireActiveSubscription, activitiesRoutes);
  app.use("/api/tasks", requireActiveSubscription, tasksRoutes);
  app.use("/api/accounts", requireActiveSubscription, accountsRoutes);
  app.use("/api/contacts", requireActiveSubscription, contactsRoutes);
  app.use("/api/deal-stages", requireActiveSubscription, dealStagesRoutes);
  app.use("/api/chart-of-accounts", requireActiveSubscription, chartOfAccountsRoutes);
  app.use("/api/journals", requireActiveSubscription, journalsRoutes);
  app.use("/api/tickets", requireActiveSubscription, ticketsRoutes);
  app.use("/api/teams", requireActiveSubscription, teamsRoutes);
  app.use("/api/notes", requireActiveSubscription, notesRoutes);
  app.use("/api/attachments", requireActiveSubscription, attachmentsRoutes);
  app.use("/api/recurring-invoices", requireActiveSubscription, recurringInvoicesRoutes);
  app.use("/api/search", requireActiveSubscription, searchRoutes);
  app.use("/api/ai", requireActiveSubscription, aiRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
