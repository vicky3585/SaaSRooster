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

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/customers", customersRoutes);
  app.use("/api/invoices", invoicesRoutes);
  app.use("/api/warehouses", warehousesRoutes);
  app.use("/api/items", itemsRoutes);
  app.use("/api/stock-transactions", stockTransactionsRoutes);
  app.use("/api/expenses", expensesRoutes);
  app.use("/api/memberships", membershipsRoutes);
  app.use("/api/organizations", organizationsRoutes);
  app.use("/api/leads", leadsRoutes);
  app.use("/api/deals", dealsRoutes);
  app.use("/api/activities", activitiesRoutes);
  app.use("/api/tasks", tasksRoutes);
  app.use("/api/accounts", accountsRoutes);
  app.use("/api/contacts", contactsRoutes);
  app.use("/api/deal-stages", dealStagesRoutes);
  app.use("/api/chart-of-accounts", chartOfAccountsRoutes);
  app.use("/api/journals", journalsRoutes);
  app.use("/api/tickets", ticketsRoutes);
  app.use("/api/teams", teamsRoutes);
  app.use("/api/notes", notesRoutes);
  app.use("/api/attachments", attachmentsRoutes);
  app.use("/api/recurring-invoices", recurringInvoicesRoutes);
  app.use("/api/search", searchRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
