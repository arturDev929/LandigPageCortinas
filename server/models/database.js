import mysql from "mysql2/promise";
import { config } from "../config.js";
import { migrateDatabase } from "../migrations/runner.js";

export const database = mysql.createPool({
  host: config.databaseHost,
  port: config.databasePort,
  user: config.databaseUser,
  password: config.databasePassword,
  database: config.databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

export async function createDatabaseIfNeeded() {
  const connection = await mysql.createConnection({
    host: config.databaseHost,
    port: config.databasePort,
    user: config.databaseUser,
    password: config.databasePassword,
    charset: "utf8mb4"
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

export async function initializeDatabase() {
  await createDatabaseIfNeeded();
  await database.query("SELECT 1");
  return migrateDatabase(database, config.migrationsDirectory);
}
