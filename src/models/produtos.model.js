import db from "../db_config/connection.js";

// Consulta base: junta produtos + marcas (1:N) + detalhes_produto (1:1) + categorias (N:N)
const SELECT_PRODUTOS = `
  SELECT l.id, l.nome, l.preco, l.disponibilidade, l.estoque, l.marca_id,
         a.nome AS marca, d.tamanho, d.condicao,
         GROUP_CONCAT(c.id) AS categoria_ids,
         GROUP_CONCAT(c.nome, '|') AS categorias
  FROM produtos l
  LEFT JOIN marcas a ON a.id = l.marca_id
  LEFT JOIN detalhes_produto d ON d.produto_id = l.id
  LEFT JOIN produtos_categorias lc ON lc.produto_id = l.id
  LEFT JOIN categorias c ON c.id = lc.categoria_id
`;

// Converte a linha do banco para o formato JSON da API
const toProduto = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    preco: row.preco,
    disponivel: row.disponibilidade === 1,
    estoque: row.estoque,
    marca_id: row.marca_id,
    marca: row.marca,
    tamanho: row.tamanho,
    condicao: row.condicao,
    categoria_ids: row.categoria_ids ? row.categoria_ids.split(",").map(Number) : [],
    categorias: row.categorias ? row.categorias.split("|") : [],
  };
};

const salvarDetalhes = (produtoId, tamanho, condicao) => {
  db.prepare(
    `
    INSERT INTO detalhes_produto (produto_id, tamanho, condicao)
    VALUES (?, ?, ?)
    ON CONFLICT(produto_id) DO UPDATE SET tamanho = excluded.tamanho, condicao = excluded.condicao
    `,
  ).run(produtoId, tamanho ?? null, condicao ?? null);
};

const salvarCategorias = (produtoId, categoriaIds) => {
  db.prepare("DELETE FROM produtos_categorias WHERE produto_id = ?").run(produtoId);
  const insert = db.prepare("INSERT INTO produtos_categorias (produto_id, categoria_id) VALUES (?, ?)");
  for (const categoriaId of new Set(categoriaIds)) insert.run(produtoId, categoriaId);
};

export default class ProdutosModel {
  // READ - todos (com filtro opcional por nome, marca ou categoria)
  findAll(busca = "") {
    const termo = `%${busca}%`;
    const rows = db
      .prepare(
        `${SELECT_PRODUTOS}
         WHERE (? = '' OR l.nome LIKE ? OR a.nome LIKE ? OR c.nome LIKE ?)
         GROUP BY l.id
         ORDER BY l.id`,
      )
      .all(busca, termo, termo, termo);
    return rows.map(toProduto);
  }

  // READ - um pelo id
  findById(id) {
    const row = db.prepare(`${SELECT_PRODUTOS} WHERE l.id = ? GROUP BY l.id`).get(id);
    return toProduto(row);
  }

  // CREATE - insere produto, detalhes (1:1) e categorias (N:N) numa única transação
  create({ nome, preco = null, disponivel = true, estoque = 1, marca_id = null, categoria_ids = [], tamanho, condicao }) {
    const criar = db.transaction(() => {
      const result = db
        .prepare(
          `
          INSERT INTO produtos (nome, disponibilidade, preco, estoque, marca_id)
          VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run(nome.trim(), disponivel ? 1 : 0, preco, estoque ?? 1, marca_id);
      const id = Number(result.lastInsertRowid);
      if (tamanho !== undefined || condicao !== undefined) salvarDetalhes(id, tamanho, condicao);
      salvarCategorias(id, categoria_ids);
      return id;
    });
    return this.findById(criar());
  }

  // UPDATE (PUT) - substitui o produto completo
  replace(id, { nome, preco = null, disponivel = true, estoque = 1, marca_id = null, categoria_ids, tamanho, condicao }) {
    const substituir = db.transaction(() => {
      const result = db
        .prepare(
          `
          UPDATE produtos
          SET nome = ?, disponibilidade = ?, preco = ?, estoque = ?, marca_id = ?
          WHERE id = ?
          `,
        )
        .run(nome.trim(), disponivel ? 1 : 0, preco, estoque ?? 1, marca_id, id);
      if (result.changes === 0) return false;
      if (tamanho !== undefined || condicao !== undefined) salvarDetalhes(id, tamanho, condicao);
      if (categoria_ids !== undefined) salvarCategorias(id, categoria_ids);
      return true;
    });
    return substituir() ? this.findById(id) : null;
  }

  // UPDATE (PATCH) - altera apenas os campos enviados
  update(id, dados) {
    const atual = this.findById(id);
    if (!atual) return null;

    const colunas = { nome: "nome", preco: "preco", disponivel: "disponibilidade", estoque: "estoque", marca_id: "marca_id" };
    const campos = Object.keys(colunas).filter((campo) => dados[campo] !== undefined);

    const atualizar = db.transaction(() => {
      if (campos.length > 0) {
        const set = campos.map((campo) => `${colunas[campo]} = ?`).join(", ");
        const valores = campos.map((campo) => {
          if (campo === "disponivel") return dados.disponivel ? 1 : 0;
          if (campo === "nome") return dados.nome.trim();
          return dados[campo];
        });
        db.prepare(`UPDATE produtos SET ${set} WHERE id = ?`).run(...valores, id);
      }
      if (dados.tamanho !== undefined || dados.condicao !== undefined) {
        salvarDetalhes(id, dados.tamanho ?? atual.tamanho, dados.condicao ?? atual.condicao);
      }
      if (dados.categoria_ids !== undefined) salvarCategorias(id, dados.categoria_ids);
    });
    atualizar();
    return this.findById(id);
  }

  // DELETE - detalhes_produto e produtos_categorias são removidos por ON DELETE CASCADE
  remove(id) {
    const produto = this.findById(id);
    if (!produto) return null;
    db.prepare("DELETE FROM produtos WHERE id = ?").run(id);
    return produto;
  }

  // N:N - vincula uma categoria ao produto
  addCategoria(produtoId, categoriaId) {
    return db
      .prepare("INSERT OR IGNORE INTO produtos_categorias (produto_id, categoria_id) VALUES (?, ?)")
      .run(produtoId, categoriaId).changes;
  }

  // N:N - remove apenas o vínculo (não apaga produto nem categoria)
  removeCategoria(produtoId, categoriaId) {
    return db
      .prepare("DELETE FROM produtos_categorias WHERE produto_id = ? AND categoria_id = ?")
      .run(produtoId, categoriaId).changes;
  }

  count() {
    return db.prepare("SELECT COUNT(*) AS total FROM produtos").get().total;
  }
}
