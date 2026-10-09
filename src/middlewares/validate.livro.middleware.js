// Middleware para validação dos dados de um livro enviados no corpo da requisição.
// Use validateLivro(true) para POST/PUT (titulo obrigatório) e validateLivro(false) para PATCH.
const validateLivro = (tituloObrigatorio = true) => (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Envie os dados do livro em JSON." });
  }

  const erros = [];
  const { titulo, ano, disponivel, exemplares, autor_id, categoria_ids } = body;

  if (tituloObrigatorio || titulo !== undefined) {
    if (typeof titulo !== "string" || titulo.trim() === "") {
      erros.push("O campo 'titulo' é obrigatório e deve ser um texto.");
    }
  }
  if (ano !== undefined && ano !== null && !Number.isInteger(ano)) {
    erros.push("O campo 'ano' deve ser um número inteiro.");
  }
  if (disponivel !== undefined && typeof disponivel !== "boolean") {
    erros.push("O campo 'disponivel' deve ser true ou false.");
  }
  if (exemplares !== undefined && exemplares !== null && (!Number.isInteger(exemplares) || exemplares < 0)) {
    erros.push("O campo 'exemplares' deve ser um inteiro maior ou igual a zero.");
  }
  if (autor_id !== undefined && autor_id !== null && (!Number.isInteger(autor_id) || autor_id <= 0)) {
    erros.push("O campo 'autor_id' deve ser um número inteiro positivo.");
  }
  if (
    categoria_ids !== undefined &&
    (!Array.isArray(categoria_ids) || categoria_ids.some((c) => !Number.isInteger(c) || c <= 0))
  ) {
    erros.push("O campo 'categoria_ids' deve ser uma lista de números inteiros.");
  }

  if (!tituloObrigatorio) {
    const campos = ["titulo", "ano", "disponivel", "exemplares", "autor_id", "categoria_ids", "isbn", "editora"];
    if (!campos.some((c) => body[c] !== undefined)) {
      erros.push(`Envie ao menos um campo para atualizar: ${campos.join(", ")}.`);
    }
  }

  if (erros.length > 0) {
    return res.status(400).json({ message: "Dados inválidos!", erros });
  }
  next();
};

export default validateLivro;
