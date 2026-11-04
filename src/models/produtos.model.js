import db from "../db_config/connection.js";

// Consulta base usada em quase todas as leituras de produto.
// JOIN = junta linhas de tabelas diferentes usando as chaves estrangeiras:
// - produto.id_categoria  = categoria.id_categoria   (CATEGORIA 1:N PRODUTO)
// - produto.id_fornecedor = fornecedor.id_fornecedor (FORNECEDOR 1:N PRODUTO)
// INNER JOIN porque, pelo DER, todo produto TEM uma categoria e um fornecedor.
const SELECT_PRODUTOS = `
  SELECT p.id_produto, p.nome, p.descricao, p.tamanho, p.preco, p.estado_conservacao,
         p.disponibilidade, p.imagem_url, p.id_categoria, p.id_fornecedor,
         c.nome AS categoria, f.nome AS fornecedor, f.id_cliente AS id_cliente_anunciante
  FROM produto p
  INNER JOIN categoria c  ON c.id_categoria  = p.id_categoria
  INNER JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor
`;

// Converte a linha do banco para o formato JSON da API
// (disponibilidade é 0/1 no SQLite, mas na API vira true/false)
const toProduto = (row) => {
  if (!row) return null;
  return { ...row, disponibilidade: row.disponibilidade === 1 };
};

export default class ProdutosModel {
  // SELECT com WHERE opcional: busca pelo nome, descrição, categoria ou anunciante
  // LIKE '%termo%' encontra o termo em qualquer parte do texto
  findAll(busca = "") {
    const termo = `%${busca}%`;
    return db
      .prepare(
        `${SELECT_PRODUTOS}
         WHERE (? = '' OR p.nome LIKE ? OR p.descricao LIKE ? OR c.nome LIKE ? OR f.nome LIKE ?)
         ORDER BY p.id_produto`,
      )
      .all(busca, termo, termo, termo, termo)
      .map(toProduto);
  }

  // SELECT de um produto pela PK. O "?" é um parâmetro: o valor é enviado separado do SQL,
  // o que evita SQL Injection.
  findById(id) {
    return toProduto(db.prepare(`${SELECT_PRODUTOS} WHERE p.id_produto = ?`).get(id));
  }

  // INSERT: cria um produto novo. Se id_categoria ou id_fornecedor não existirem,
  // a FOREIGN KEY faz o SQLite recusar o INSERT (o controller transforma isso em erro 400).
  create({ nome, descricao = null, tamanho = null, preco = null, estado_conservacao = null, disponibilidade = true, imagem_url = null, id_categoria, id_fornecedor }) {
    const result = db
      .prepare(
        `
        INSERT INTO produto (nome, descricao, tamanho, preco, estado_conservacao, disponibilidade, imagem_url, id_categoria, id_fornecedor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      )
      .run(nome.trim(), descricao || null, tamanho || null, preco, estado_conservacao || null, disponibilidade ? 1 : 0, imagem_url || null, id_categoria, id_fornecedor);
    return this.findById(Number(result.lastInsertRowid));
  }

  // UPDATE (PUT): substitui todos os campos editáveis. O fornecedor (dono do anúncio) não muda.
  // WHERE id_produto = ? garante que só UMA linha seja alterada.
  replace(id, { nome, descricao = null, tamanho = null, preco = null, estado_conservacao = null, disponibilidade = true, imagem_url = null, id_categoria }) {
    const result = db
      .prepare(
        `
        UPDATE produto
        SET nome = ?, descricao = ?, tamanho = ?, preco = ?, estado_conservacao = ?,
            disponibilidade = ?, imagem_url = ?, id_categoria = ?
        WHERE id_produto = ?
        `,
      )
      .run(nome.trim(), descricao || null, tamanho || null, preco, estado_conservacao || null, disponibilidade ? 1 : 0, imagem_url || null, id_categoria, id);
    return result.changes ? this.findById(id) : null;
  }

  // UPDATE (PATCH): altera só os campos que vieram na requisição
  update(id, dados) {
    if (!this.findById(id)) return null;
    const colunas = ["nome", "descricao", "tamanho", "preco", "estado_conservacao", "disponibilidade", "imagem_url", "id_categoria"];
    const campos = colunas.filter((campo) => dados[campo] !== undefined);
    if (campos.length > 0) {
      const set = campos.map((campo) => `${campo} = ?`).join(", ");
      const valores = campos.map((campo) => {
        if (campo === "disponibilidade") return dados.disponibilidade ? 1 : 0;
        if (campo === "nome") return dados.nome.trim();
        return dados[campo] === "" ? null : dados[campo];
      });
      db.prepare(`UPDATE produto SET ${set} WHERE id_produto = ?`).run(...valores, id);
    }
    return this.findById(id);
  }

  // DELETE: apaga o produto. Se ele já estiver em algum item_pedido,
  // a FK (sem ON DELETE) bloqueia a exclusão para não perder o histórico de vendas.
  remove(id) {
    const produto = this.findById(id);
    if (!produto) return null;
    db.prepare("DELETE FROM produto WHERE id_produto = ?").run(id);
    return produto;
  }

  count() {
    return db.prepare("SELECT COUNT(*) AS total FROM produto").get().total;
  }
}
