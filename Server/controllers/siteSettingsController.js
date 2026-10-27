import { defaultSiteSettings, siteSettingsModel } from "../models/siteSettingsModel.js";

const allowedSettings = new Set(Object.keys(defaultSiteSettings));
const maxLengths = {
  siteName: 80,
  tagline: 120,
  logoImageUrl: 2048,
  faviconUrl: 2048,
  metaDescription: 300,
  heroEyebrow: 80,
  heroTitle: 140,
  heroDescription: 300,
  heroButtonLabel: 60,
  whatsappMessage: 300,
  contactEmail: 254,
  contactPhone: 40,
  whatsappNumber: 40,
  contactAddress: 180,
  instagramUrl: 2048
};

function isValidWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidImageUrl(value) {
  return isValidWebUrl(value) || /^\/uploads\/[\w-]+\.(?:jpe?g|png|gif|webp)$/i.test(value);
}

function validateSettings(settings) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return "As informações do site são inválidas.";
  }

  for (const [key, value] of Object.entries(settings)) {
    if (!allowedSettings.has(key)) return `A definição "${key}" não é permitida.`;
    if (typeof value !== "string" || value.trim().length > maxLengths[key]) {
      return `O campo "${key}" tem um formato inválido ou excede o limite permitido.`;
    }
  }

  for (const key of ["siteName", "tagline"]) {
    if (settings[key] !== undefined && !settings[key].trim()) {
      return `O campo "${key}" não pode ficar vazio.`;
    }
  }

  for (const key of ["logoImageUrl"]) {
    if (settings[key] && !isValidImageUrl(settings[key])) {
      return `O campo "${key}" deve conter um URL HTTP/HTTPS ou uma imagem carregada no site.`;
    }
  }

  const isLocalIconPath = settings.faviconUrl?.startsWith("/")
    && !settings.faviconUrl.startsWith("//")
    && !settings.faviconUrl.includes("\\")
    && !/[\u0000-\u001f]/.test(settings.faviconUrl);
  if (settings.faviconUrl && !isValidWebUrl(settings.faviconUrl) && !isLocalIconPath) {
    return "O ícone deve usar um URL HTTP/HTTPS ou um caminho local iniciado por /.";
  }

  if (settings.instagramUrl && !isValidWebUrl(settings.instagramUrl)) {
    return "Indique um URL HTTP/HTTPS válido para o Instagram.";
  }

  if (settings.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contactEmail.trim())) {
    return "Indique um endereço de email válido.";
  }

  if (settings.whatsappNumber) {
    const digits = settings.whatsappNumber.replace(/\D/g, "");
    if (!/^[+\d\s().-]+$/.test(settings.whatsappNumber) || digits.length < 8 || digits.length > 15) {
      return "Indique um número de WhatsApp válido, incluindo o indicativo do país.";
    }
  }

  return null;
}

export const siteSettingsController = {
  async get(_req, res) {
    res.json(await siteSettingsModel.getAll());
  },

  async update(req, res) {
    const error = validateSettings(req.body);
    if (error) return res.status(400).json({ error });

    const settings = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [key, value.trim()])
    );
    res.json(await siteSettingsModel.update(settings));
  }
};
