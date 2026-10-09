import db from "../db_config/connection.js";

export default class AutoresModel {
  findAll() {
    return db
      .prepare(
        `
        SELECT a.id, a.nome, COUNT(l.id) AS total_livros
        FROM autores a
        LEFT JOIN livros l ON l.autor_id = a.id
        GROUP BY a.id
        ORDER BY a.nome
        `,
      )
      .all();
  }

  // Autor + seus livros (relacionamento 1:N)
  findById(id) {
    const autor = db.prepare("SELECT * FROM autores WHERE id = ?").get(id);
    if (!autor) return null;
    autor.livros = db.prepare("SELECT id, titulo, ano FROM livros WHERE autor_id = ? ORDER BY ano").all(id);
    return autor;
  }

  create(nome) {
    const result = db.prepare("INSERT INTO autores (nome) VALUES (?)").run(nome.trim());
    return this.findById(Number(result.lastInsertRowid));
  }

  update(id, nome) {
    const result = db.prepare("UPDATE autores SET nome = ? WHERE id = ?").run(nome.trim(), id);
    return result.changes ? this.findById(id) : null;
  }

  // Os livros do autor continuam existindo, com autor_id = NULL (ON DELETE SET NULL)
  remove(id) {
    const autor = this.findById(id);
    if (!autor) return null;
    db.prepare("DELETE FROM autores WHERE id = ?").run(id);
    return autor;
  }

  count() {
    return db.prepare("SELECT COUNT(*) AS total FROM autores").get().total;
  }
}
