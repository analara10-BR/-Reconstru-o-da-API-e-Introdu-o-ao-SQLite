// Middleware para validação dos dados de um produto enviados no corpo da requisição.
// Use validateProduto(true) para POST/PUT (nome obrigatório) e validateProduto(false) para PATCH.
const validateProduto = (nomeObrigatorio = true) => (req, res, next) => {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Envie os dados do produto em JSON." });
  }

  const erros = [];
  const { nome, preco, disponivel, estoque, marca_id, categoria_ids, imagem_url, descricao } = body;

  if (nomeObrigatorio || nome !== undefined) {
    if (typeof nome !== "string" || nome.trim() === "") {
      erros.push("O campo 'nome' é obrigatório e deve ser um texto.");
    }
  }
  if (preco !== undefined && preco !== null && (typeof preco !== "number" || !Number.isFinite(preco) || preco < 0)) {
    erros.push("O campo 'preco' deve ser um número maior ou igual a zero.");
  }
  if (imagem_url !== undefined && imagem_url !== null && (typeof imagem_url !== "string" || imagem_url.length > 1000)) {
    erros.push("O campo 'imagem_url' deve ser um endereço de imagem válido em texto.");
  }
  if (descricao !== undefined && descricao !== null && (typeof descricao !== "string" || descricao.length > 2000)) {
    erros.push("O campo 'descricao' deve ser um texto de até 2000 caracteres.");
  }
  if (disponivel !== undefined && typeof disponivel !== "boolean") {
    erros.push("O campo 'disponivel' deve ser true ou false.");
  }
  if (estoque !== undefined && estoque !== null && (!Number.isInteger(estoque) || estoque < 0)) {
    erros.push("O campo 'estoque' deve ser um inteiro maior ou igual a zero.");
  }
  if (marca_id !== undefined && marca_id !== null && (!Number.isInteger(marca_id) || marca_id <= 0)) {
    erros.push("O campo 'marca_id' deve ser um número inteiro positivo.");
  }
  if (
    categoria_ids !== undefined &&
    (!Array.isArray(categoria_ids) || categoria_ids.some((c) => !Number.isInteger(c) || c <= 0))
  ) {
    erros.push("O campo 'categoria_ids' deve ser uma lista de números inteiros.");
  }

  if (!nomeObrigatorio) {
    const campos = ["nome", "preco", "disponivel", "estoque", "marca_id", "categoria_ids", "tamanho", "condicao", "imagem_url", "descricao"];
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
