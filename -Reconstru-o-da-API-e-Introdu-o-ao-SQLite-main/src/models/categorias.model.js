import db from "../db_config/connection.js";

export default class CategoriasModel {
  findAll() {
    return db
      .prepare(
        `
        SELECT c.id, c.nome, COUNT(lc.produto_id) AS total_produtos
        FROM categorias c
        LEFT JOIN produtos_categorias lc ON lc.categoria_id = c.id
        GROUP BY c.id
        ORDER BY c.nome
        `,
      )
      .all();
  }

  // Categoria + seus produtos (relacionamento N:N)
  findById(id) {
    const categoria = db.prepare("SELECT * FROM categorias WHERE id = ?").get(id);
    if (!categoria) return null;
    categoria.produtos = db
      .prepare(
        `
        SELECT l.id, l.nome, l.preco
        FROM produtos l
        INNER JOIN produtos_categorias lc ON lc.produto_id = l.id
        WHERE lc.categoria_id = ?
        ORDER BY l.nome
        `,
      )
      .all(id);
    return categoria;
  }

  create(nome) {
    const result = db.prepare("INSERT INTO categorias (nome) VALUES (?)").run(nome.trim());
    return this.findById(Number(result.lastInsertRowid));
  }

  update(id, nome) {
    const result = db.prepare("UPDATE categorias SET nome = ? WHERE id = ?").run(nome.trim(), id);
    return result.changes ? this.findById(id) : null;
  }

  // Os vínculos em produtos_categorias são removidos por ON DELETE CASCADE
  remove(id) {
    const categoria = this.findById(id);
    if (!categoria) return null;
    db.prepare("DELETE FROM categorias WHERE id = ?").run(id);
    return categoria;
  }
}
