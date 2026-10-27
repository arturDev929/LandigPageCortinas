import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const imageTypes = {
  "image/jpeg": { extension: "jpg", signature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: "png", signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/gif": { extension: "gif", signature: (buffer) => ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)) },
  "image/webp": { extension: "webp", signature: (buffer) => buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" }
};

export const imageUploadController = {
  async upload(req, res) {
    const mimeType = req.get("content-type")?.split(";")[0].trim().toLowerCase();
    const imageType = imageTypes[mimeType];
    if (!imageType) {
      return res.status(415).json({ error: "Formato inválido. Use uma imagem JPG, PNG, GIF ou WebP." });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "Selecione uma imagem válida para carregar." });
    }

    if (!imageType.signature(req.body)) {
      return res.status(400).json({ error: "O ficheiro não corresponde ao formato de imagem indicado." });
    }

    const fileName = `${randomUUID()}.${imageType.extension}`;
    await mkdir(config.uploadsDirectory, { recursive: true });
    await writeFile(path.join(config.uploadsDirectory, fileName), req.body, { flag: "wx" });

    res.status(201).json({ url: `/uploads/${fileName}` });
  }
};
