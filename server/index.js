import express from "express";
import { config } from "./config.js";
import { authRoutes } from "./routes/authRoutes.js";
import { productRoutes } from "./routes/productRoutes.js";
import { siteSettingsRoutes } from "./routes/siteSettingsRoutes.js";
import { database, initializeDatabase } from "./models/database.js";
import { seedAdmin } from "./models/adminModel.js";
import { seedProducts } from "./models/seed.js";
import cors from "cors";
import path from "node:path";

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: config.frontendUrl }));
app.use(express.json({ limit: "32kb" }));
app.use("/uploads", express.static(config.uploadsDirectory, {
  fallthrough: false,
  index: false,
  dotfiles: "deny",
  immutable: true,
  maxAge: "1y"
}));
app.use("/api/products", productRoutes);
app.use("/api/admin", authRoutes);
app.use("/api/settings", siteSettingsRoutes);

if (config.production) {
  app.use(express.static(config.clientBuildDirectory));
  app.get("*", (_req, res) => res.sendFile(path.join(config.clientBuildDirectory, "index.html")));
}

app.use((error, req, res, _next) => {
  console.error(error);
  if (error.status === 413) {
    const message = req.path === "/api/products/images"
      ? "A imagem excede o limite de 5 MB."
      : "O pedido excede o limite permitido.";
    return res.status(413).json({ error: message });
  }
  if (error.status === 404) {
    return res.status(404).json({ error: "Imagem não encontrada." });
  }
  res.status(500).json({ error: "Ocorreu um erro interno. Tente novamente." });
});

async function startServer() {
  await initializeDatabase();
  await seedProducts();
  await seedAdmin();

  const server = app.listen(config.port, () => {
    console.log(`API Atelier Lume ligada à base MySQL ${config.databaseName} em http://localhost:${config.port}`);
  });

  async function closeServer() {
    server.close(async () => {
      await database.end();
      process.exit(0);
    });
  }

  process.once("SIGINT", closeServer);
  process.once("SIGTERM", closeServer);
}

startServer().catch(async (error) => {
  console.error("Não foi possível iniciar a aplicação. Verifique a ligação e as permissões do MySQL.", error);
  await database.end();
  process.exitCode = 1;
});
