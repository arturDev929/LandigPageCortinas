import fs from "node:fs/promises";
import path from "node:path";

export async function migrateDatabase(pool, migrationsDirectory) {
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(190) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [existingMigrations] = await connection.query("SELECT name FROM schema_migrations");
    const appliedMigrations = new Set(existingMigrations.map((migration) => migration.name));
    const migrationFiles = (await fs.readdir(migrationsDirectory))
      .filter((name) => /^\d+_[\w-]+\.sql$/.test(name))
      .sort();
    const newlyApplied = [];

    for (const name of migrationFiles) {
      if (appliedMigrations.has(name)) continue;

      const sql = await fs.readFile(path.join(migrationsDirectory, name), "utf8");
      try {
        await connection.beginTransaction();
        for (const statement of sql.split(";").map((part) => part.trim()).filter(Boolean)) {
          await connection.query(statement);
        }
        await connection.execute("INSERT INTO schema_migrations (name) VALUES (?)", [name]);
        await connection.commit();
        newlyApplied.push(name);
      } catch (error) {
        await connection.rollback();
        throw new Error(`Falha ao aplicar a migração ${name}.`, { cause: error });
      }
    }

    return newlyApplied;
  } finally {
    connection.release();
  }
}
