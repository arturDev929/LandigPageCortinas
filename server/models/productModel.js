import { database } from "./database.js";

const productColumns = `
  id,
  name,
  category,
  description,
  price,
  promo_price AS promoPrice,
  unit,
  image,
  tag
`;

export const productModel = {
  async list() {
    const [products] = await database.query(`SELECT ${productColumns} FROM products ORDER BY name`);
    return products;
  },
  async findById(id) {
    const [products] = await database.execute(`SELECT ${productColumns} FROM products WHERE id = ?`, [id]);
    return products[0] ?? null;
  },
  async create(product) {
    await database.execute(`
      INSERT INTO products (id, name, category, description, price, promo_price, unit, image, tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [product.id, product.name, product.category, product.description, product.price, product.promoPrice, product.unit, product.image, product.tag]);
    return this.findById(product.id);
  },
  async update(product) {
    await database.execute(`
      UPDATE products
      SET name = ?, category = ?, description = ?, price = ?, promo_price = ?, unit = ?, image = ?, tag = ?
      WHERE id = ?
    `, [product.name, product.category, product.description, product.price, product.promoPrice, product.unit, product.image, product.tag, product.id]);
    return this.findById(product.id);
  },
  async delete(id) {
    const [result] = await database.execute("DELETE FROM products WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
