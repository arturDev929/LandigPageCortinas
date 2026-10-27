import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3001,
  production: process.env.NODE_ENV === "production",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  databaseClient: (process.env.DB_CLIENT || "mysql").toLowerCase(),
  projectDirectory: serverDirectory,
  clientBuildDirectory: path.resolve(serverDirectory, "..", "Client", "dist"),
  databaseName: process.env.DB_NAME || "bd_curtinas",
  databaseHost: process.env.DB_HOST || "127.0.0.1",
  databasePort: Number(process.env.DB_PORT) || 3306,
  databaseUser: process.env.DB_USER || "root",
  databasePassword: process.env.DB_PASSWORD || "",
  migrationsDirectory: path.join(serverDirectory, "migrations"),
  uploadsDirectory: path.join(serverDirectory, "uploads"),
  adminEmail: (process.env.ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "admin123"
};

if (config.databaseClient !== "mysql") {
  throw new Error("DB_CLIENT tem de ser mysql.");
}

if (config.production && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) {
  throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD antes de iniciar em produção.");
}

if (!/^[a-zA-Z0-9_]+$/.test(config.databaseName)) {
  throw new Error("DB_NAME só pode conter letras, números e underscores.");
}
