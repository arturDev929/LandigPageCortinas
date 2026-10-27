import { database } from "./database.js";

export const defaultSiteSettings = {
  siteName: "Atelier Lume",
  tagline: "Cortinas para a sua casa",
  logoImageUrl: "",
  faviconUrl: "/favicon.svg",
  metaDescription: "Veja os modelos de cortinas da Atelier Lume. Consulte os preços e fale connosco para esclarecer dúvidas.",
  heroEyebrow: "Conheça os modelos",
  heroTitle: "A cortina certa muda a divisão.",
  heroDescription: "Veja os modelos disponíveis e fale connosco para escolher o tecido e o tamanho ideais.",
  heroButtonLabel: "Ver cortinas",
  whatsappMessage: "Olá! Gostaria de saber mais sobre as cortinas.",
  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",
  contactAddress: "",
  instagramUrl: ""
};

export const siteSettingsModel = {
  async getAll() {
    const [rows] = await database.query("SELECT setting_key, setting_value FROM site_settings");
    return rows.reduce((settings, row) => {
      if (Object.hasOwn(defaultSiteSettings, row.setting_key)) {
        settings[row.setting_key] = row.setting_value;
      }
      return settings;
    }, { ...defaultSiteSettings });
  },

  async update(settings) {
    const connection = await database.getConnection();
    try {
      await connection.beginTransaction();
      for (const [key, value] of Object.entries(settings)) {
        await connection.execute(`
          INSERT INTO site_settings (setting_key, setting_value)
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
        `, [key, value]);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getAll();
  }
};
