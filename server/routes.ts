import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  
  app.use("/api/auth", authRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
