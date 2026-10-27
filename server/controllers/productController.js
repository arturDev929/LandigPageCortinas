import { randomUUID } from "node:crypto";
import { productModel } from "../models/productModel.js";

function validateProduct(product) {
  const name = typeof product.name === "string" ? product.name.trim() : "";
  const category = typeof product.category === "string" ? product.category.trim() : "";
  const description = typeof product.description === "string" ? product.description.trim() : "";
  const image = typeof product.image === "string" ? product.image.trim() : "";
  const price = Number(product.price);
  const promoPrice = Number(product.promoPrice);
  const submittedTag = typeof product.tag === "string" ? product.tag : "";
  const isPromotion = submittedTag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() === "promocao";

  if (!name || name.length > 80) return "O nome é obrigatório (máximo de 80 caracteres).";
  if (!category || category.length > 40) return "A categoria é obrigatória (máximo de 40 caracteres).";
  if (!description || description.length > 300) return "A descrição é obrigatória (máximo de 300 caracteres).";
  if (!Number.isFinite(price) || price < 0 || price > 100000) return "Indique um preço válido.";
  if (isPromotion && (!Number.isFinite(promoPrice) || promoPrice <= 0 || promoPrice >= price || promoPrice > 100000)) {
    return "O preço promocional deve ser maior que zero e inferior ao preço anterior.";
  }
  const isWebUrl = /^https?:\/\/\S+$/i.test(image);
  const isUploadedImage = /^\/uploads\/[0-9a-f-]{36}\.(?:jpg|png|gif|webp)$/i.test(image);
  if (!image || image.length > 2048 || (!isWebUrl && !isUploadedImage)) {
    return "Indique um URL válido ou carregue uma imagem do computador.";
  }

  return null;
}

function normalizeProduct(product, id) {
  const tag = typeof product.tag === "string" ? product.tag.trim().slice(0, 30) : "";
  const isPromotion = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === "promocao";
  return {
    id,
    name: product.name.trim(),
    category: product.category.trim(),
    description: product.description.trim(),
    price: Number(product.price),
    promoPrice: isPromotion ? Number(product.promoPrice) : null,
    unit: "por painel",
    image: product.image.trim(),
    tag
  };
}

export const productController = {
  async list(_req, res) {
    res.json(await productModel.list());
  },

  async create(req, res) {
    const error = validateProduct(req.body ?? {});
    if (error) return res.status(400).json({ error });

    res.status(201).json(await productModel.create(normalizeProduct(req.body, randomUUID())));
  },

  async update(req, res) {
    const error = validateProduct(req.body ?? {});
    if (error) return res.status(400).json({ error });

    const product = await productModel.update(normalizeProduct(req.body, req.params.id));
    if (!product) return res.status(404).json({ error: "Produto não encontrado." });

    res.json(product);
  },

  async delete(req, res) {
    if (!await productModel.delete(req.params.id)) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    res.status(204).end();
  }
};
