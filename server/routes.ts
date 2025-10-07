import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import customersRoutes from "./routes/customers";
import warehousesRoutes from "./routes/warehouses";
import itemsRoutes from "./routes/items";
import stockTransactionsRoutes from "./routes/stockTransactions";
import expensesRoutes from "./routes/expenses";
import membershipsRoutes from "./routes/memberships";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/customers", customersRoutes);
  app.use("/api/warehouses", warehousesRoutes);
  app.use("/api/items", itemsRoutes);
  app.use("/api/stock-transactions", stockTransactionsRoutes);
  app.use("/api/expenses", expensesRoutes);
  app.use("/api/memberships", membershipsRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
