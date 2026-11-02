import { FOTO_TAMANHO_MAXIMO, lerFotoBase64 } from "../utils/foto.js";

const textoOpcional = (valor, max) => valor === undefined || valor === null || (typeof valor === "string" && valor.length <= max);

// Middleware para validação dos dados de um produto (anúncio) enviados no corpo da requisição.
// Use validateProduto(true) para POST/PUT (campos obrigatórios) e validateProduto(false) para PATCH.
const validateProduto = (completo = true) => (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Envie os dados do produto em JSON." });
  }

  const erros = [];
  const { nome, preco, descricao, tamanho, estado_conservacao, disponibilidade, id_categoria, imagem_url, foto } = body;

  // Obrigatórios no cadastro: nome, preço e categoria (no DER todo produto tem uma categoria)
  if (completo || nome !== undefined) {
    if (typeof nome !== "string" || nome.trim() === "" || nome.length > 120) {
      erros.push("O campo 'nome' é obrigatório (até 120 caracteres).");
    }
  }
  if (completo || preco !== undefined) {
    if (typeof preco !== "number" || !Number.isFinite(preco) || preco < 0) {
      erros.push("O campo 'preco' é obrigatório e deve ser um número maior ou igual a zero.");
    }
  }
  if (completo || id_categoria !== undefined) {
    if (!Number.isInteger(id_categoria) || id_categoria <= 0) {
      erros.push("Escolha uma categoria ('id_categoria' deve ser um número inteiro positivo).");
    }
  }
  if (!textoOpcional(descricao, 2000)) erros.push("O campo 'descricao' deve ser um texto de até 2000 caracteres.");
  if (!textoOpcional(tamanho, 20)) erros.push("O campo 'tamanho' deve ser um texto de até 20 caracteres.");
  if (!textoOpcional(estado_conservacao, 60)) erros.push("O campo 'estado_conservacao' deve ser um texto de até 60 caracteres.");
  if (disponibilidade !== undefined && typeof disponibilidade !== "boolean") {
    erros.push("O campo 'disponibilidade' deve ser true ou false.");
  }
  // A foto pode vir como link (imagem_url) ou como arquivo enviado (foto, em base64)
  if (imagem_url !== undefined && imagem_url !== null && imagem_url !== "") {
    const linkValido = typeof imagem_url === "string" && imagem_url.length <= 1000 && (/^https?:\/\//i.test(imagem_url) || /^\/uploads\/[\w.-]+$/.test(imagem_url));
    if (!linkValido) erros.push("O campo 'imagem_url' deve ser um link http(s) para a imagem.");
  }
  if (foto !== undefined && foto !== null && foto !== "") {
    const arquivo = lerFotoBase64(foto);
    if (!arquivo) erros.push("A foto deve ser uma imagem JPG, PNG, WEBP ou GIF.");
    else if (arquivo.buffer.length > FOTO_TAMANHO_MAXIMO) erros.push("A foto deve ter no máximo 2 MB.");
  }

  if (!completo) {
    const campos = ["nome", "preco", "descricao", "tamanho", "estado_conservacao", "disponibilidade", "id_categoria", "imagem_url", "foto"];
    if (!campos.some((c) => body[c] !== undefined)) {
      erros.push(`Envie ao menos um campo para atualizar: ${campos.join(", ")}.`);
    }
  }

  if (erros.length > 0) {
    return res.status(400).json({ message: "Dados inválidos!", erros });
  }
  next();
};

export default validateProduto;
