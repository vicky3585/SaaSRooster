import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import usersRoutes from "./routes/users";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(cookieParser());
  
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
