import { config } from "./config.js";
import { createDatabaseIfNeeded, database, initializeDatabase } from "./models/database.js";

try {
  await createDatabaseIfNeeded();
  const applied = await initializeDatabase();

  if (applied.length === 0) {
    console.log(`A base de dados MySQL ${config.databaseName} já está atualizada.`);
  } else {
    console.log(`Migrações aplicadas à base de dados MySQL ${config.databaseName}: ${applied.join(", ")}`);
  }
} finally {
  await database.end();
}
