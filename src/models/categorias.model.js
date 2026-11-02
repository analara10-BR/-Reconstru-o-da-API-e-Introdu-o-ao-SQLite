import db from "../db_config/connection.js";

export default class CategoriasModel {
  // LEFT JOIN + COUNT: lista todas as categorias, mesmo as que ainda não têm produtos (contagem 0)
  findAll() {
    return db
      .prepare(
        `
        SELECT c.id_categoria, c.nome, c.descricao, COUNT(p.id_produto) AS total_produtos
        FROM categoria c
        LEFT JOIN produto p ON p.id_categoria = c.id_categoria
        GROUP BY c.id_categoria
        ORDER BY c.nome
        `,
      )
      .all();
  }

  // Categoria + seus produtos (relacionamento 1:N)
  findById(id) {
    const categoria = db.prepare("SELECT * FROM categoria WHERE id_categoria = ?").get(id);
    if (!categoria) return null;
    categoria.produtos = db
      .prepare("SELECT id_produto, nome, preco FROM produto WHERE id_categoria = ? ORDER BY nome")
      .all(id);
    return categoria;
  }

  create({ nome, descricao = null }) {
    const result = db.prepare("INSERT INTO categoria (nome, descricao) VALUES (?, ?)").run(nome.trim(), descricao || null);
    return this.findById(Number(result.lastInsertRowid));
  }

  update(id, { nome, descricao = null }) {
    const result = db
      .prepare("UPDATE categoria SET nome = ?, descricao = ? WHERE id_categoria = ?")
      .run(nome.trim(), descricao || null, id);
    return result.changes ? this.findById(id) : null;
  }

  // Se a categoria ainda tiver produtos, a FK bloqueia o DELETE (erro tratado no controller)
  remove(id) {
    const categoria = this.findById(id);
    if (!categoria) return null;
    db.prepare("DELETE FROM categoria WHERE id_categoria = ?").run(id);
    return categoria;
  }
}
