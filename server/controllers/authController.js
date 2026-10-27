import { adminModel } from "../models/adminModel.js";
import { createSession, revokeSession } from "../middleware/sessionStore.js";

export const authController = {
  async login(req, res) {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || email.length > 254 || !password || password.length > 200) {
      return res.status(400).json({ error: "Introduza um email e uma palavra-passe válidos." });
    }

    const admin = await adminModel.authenticate(email, password);
    if (!admin) return res.status(401).json({ error: "Email ou palavra-passe incorretos." });

    res.json({ token: createSession(admin.email) });
  },

  session(_req, res) {
    res.status(204).end();
  },

  logout(req, res) {
    const token = req.get("authorization").replace(/^Bearer\s+/i, "");
    revokeSession(token);
    res.status(204).end();
  }
};
