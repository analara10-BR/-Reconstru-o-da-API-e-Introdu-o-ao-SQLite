import db from "../db_config/connection.js";

export default class MarcasModel {
  findAll() {
    return db
      .prepare(
        `
        SELECT a.id, a.nome, COUNT(l.id) AS total_produtos
        FROM marcas a
        LEFT JOIN produtos l ON l.marca_id = a.id
        GROUP BY a.id
        ORDER BY a.nome
        `,
      )
      .all();
  }

  // Marca + seus produtos (relacionamento 1:N)
  findById(id) {
    const marca = db.prepare("SELECT * FROM marcas WHERE id = ?").get(id);
    if (!marca) return null;
    marca.produtos = db.prepare("SELECT id, nome, preco FROM produtos WHERE marca_id = ? ORDER BY preco").all(id);
    return marca;
  }

  create(nome) {
    const result = db.prepare("INSERT INTO marcas (nome) VALUES (?)").run(nome.trim());
    return this.findById(Number(result.lastInsertRowid));
  }

  update(id, nome) {
    const result = db.prepare("UPDATE marcas SET nome = ? WHERE id = ?").run(nome.trim(), id);
    return result.changes ? this.findById(id) : null;
  }

  // Os produtos da marca continuam existindo, com marca_id = NULL (ON DELETE SET NULL)
  remove(id) {
    const marca = this.findById(id);
    if (!marca) return null;
    db.prepare("DELETE FROM marcas WHERE id = ?").run(id);
    return marca;
  }

  count() {
    return db.prepare("SELECT COUNT(*) AS total FROM marcas").get().total;
  }
}
