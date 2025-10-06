import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";
import customersRoutes from "./routes/customers";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/customers", customersRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
