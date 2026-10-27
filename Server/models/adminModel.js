import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";
import { database } from "./database.js";

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64).toString("hex");
}

export async function seedAdmin() {
  const salt = randomBytes(16).toString("hex");
  await database.execute(`
    INSERT IGNORE INTO admin_users (email, password_salt, password_hash)
    VALUES (?, ?, ?)
  `, [config.adminEmail, salt, hashPassword(config.adminPassword, salt)]);
}

export const adminModel = {
  async authenticate(email, password) {
    const [admins] = await database.execute(`
      SELECT email, password_salt, password_hash
      FROM admin_users
      WHERE email = ?
    `, [email.trim().toLowerCase()]);
    const admin = admins[0];
    if (!admin) return null;

    const submittedHash = Buffer.from(hashPassword(password, admin.password_salt), "hex");
    const storedHash = Buffer.from(admin.password_hash, "hex");
    if (submittedHash.length !== storedHash.length || !timingSafeEqual(submittedHash, storedHash)) {
      return null;
    }

    return { email: admin.email };
  }
};
