import db from "../db_config/connection.js";

export default class CategoriasModel {
  findAll() {
    return db
      .prepare(
        `
        SELECT c.id, c.nome, COUNT(lc.livro_id) AS total_livros
        FROM categorias c
        LEFT JOIN livros_categorias lc ON lc.categoria_id = c.id
        GROUP BY c.id
        ORDER BY c.nome
        `,
      )
      .all();
  }

  // Categoria + seus livros (relacionamento N:N)
  findById(id) {
    const categoria = db.prepare("SELECT * FROM categorias WHERE id = ?").get(id);
    if (!categoria) return null;
    categoria.livros = db
      .prepare(
        `
        SELECT l.id, l.titulo, l.ano
        FROM livros l
        INNER JOIN livros_categorias lc ON lc.livro_id = l.id
        WHERE lc.categoria_id = ?
        ORDER BY l.titulo
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

  // Os vínculos em livros_categorias são removidos por ON DELETE CASCADE
  remove(id) {
    const categoria = this.findById(id);
    if (!categoria) return null;
    db.prepare("DELETE FROM categorias WHERE id = ?").run(id);
    return categoria;
  }
}
