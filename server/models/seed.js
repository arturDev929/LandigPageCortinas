import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { database } from "./database.js";

export async function seedProducts() {
  const [rows] = await database.query("SELECT COUNT(*) AS count FROM products");
  if (Number(rows[0].count) > 0) return;

  const productsFile = path.join(config.projectDirectory, "server", "data", "products.json");
  const products = JSON.parse(await fs.readFile(productsFile, "utf8"));
  const connection = await database.getConnection();
  try {
    await connection.beginTransaction();
    for (const product of products) {
      await connection.execute(`
        INSERT INTO products (id, name, category, description, price, unit, image, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [product.id, product.name, product.category, product.description, product.price, product.unit, product.image, product.tag]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
