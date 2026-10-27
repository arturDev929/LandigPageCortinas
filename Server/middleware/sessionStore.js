import { randomBytes } from "node:crypto";

const sessions = new Map();
const sessionDuration = 8 * 60 * 60 * 1000;

export function createSession(email) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { email, expiresAt: Date.now() + sessionDuration });
  return token;
}

export function revokeSession(token) {
  sessions.delete(token);
}

export function requireAdmin(req, res, next) {
  const token = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  const session = token ? sessions.get(token) : undefined;

  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Inicie sessão para continuar." });
  }

  req.admin = { email: session.email };
  next();
}
