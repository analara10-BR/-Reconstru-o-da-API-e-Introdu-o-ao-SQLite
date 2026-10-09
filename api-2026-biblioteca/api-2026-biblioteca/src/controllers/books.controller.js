export default class BooksController {
  constructor(db) {
    this.db = db;
  }

  list(req, res, next) {
    try {
      const q = String(req.query.q || "").trim();
      const rows = this.db.prepare(`
        SELECT l.id, l.titulo, l.ano, l.disponibilidade, l.exemplares,
               a.nome AS autor, d.isbn, d.editora,
               GROUP_CONCAT(c.nome, ', ') AS categorias
        FROM livros l
        LEFT JOIN autores a ON a.id = l.autor_id
        LEFT JOIN detalhes_livro d ON d.livro_id = l.id
        LEFT JOIN livros_categorias lc ON lc.livro_id = l.id
        LEFT JOIN categorias c ON c.id = lc.categoria_id
        WHERE (? = '' OR l.titulo LIKE ? OR a.nome LIKE ? OR c.nome LIKE ?)
        GROUP BY l.id
        ORDER BY l.id
      `).all(q, `%${q}%`, `%${q}%`, `%${q}%`);
      const livros = rows.map((r) => ({ ...r, disponivel: Boolean(r.disponibilidade), categorias: r.categorias ? r.categorias.split(", ") : [] }));
      res.status(200).json({ total: livros.length, livros });
    } catch (error) { next(error); }
  }

  getById(req, res, next) {
    try {
      const id = req.resourceId;
      const row = this.db.prepare(`
        SELECT l.id, l.titulo, l.ano, l.disponibilidade, l.exemplares,
               a.nome AS autor, d.isbn, d.editora,
               GROUP_CONCAT(c.nome, ', ') AS categorias
        FROM livros l
        LEFT JOIN autores a ON a.id = l.autor_id
        LEFT JOIN detalhes_livro d ON d.livro_id = l.id
        LEFT JOIN livros_categorias lc ON lc.livro_id = l.id
        LEFT JOIN categorias c ON c.id = lc.categoria_id
        WHERE l.id = ? GROUP BY l.id
      `).get(id);
      if (!row) return res.status(404).json({ message: "Livro não encontrado." });
      res.status(200).json({ ...row, disponivel: Boolean(row.disponibilidade), categorias: row.categorias ? row.categorias.split(", ") : [] });
    } catch (error) { next(error); }
  }

  create(req, res, next) {
    try {
      const { titulo, ano = null, disponivel = true, exemplares = 1, autor_id = null, categoria_ids = [], isbn = null, editora = null } = req.body;
      if (typeof titulo !== "string" || !titulo.trim()) return res.status(400).json({ message: "O campo titulo é obrigatório." });
      if (!Number.isInteger(Number(exemplares)) || Number(exemplares) < 0) return res.status(400).json({ message: "exemplares deve ser um inteiro maior ou igual a zero." });
      const create = this.db.transaction(() => {
        const result = this.db.prepare("INSERT INTO livros (titulo, ano, disponibilidade, exemplares, autor_id) VALUES (?, ?, ?, ?, ?)").run(titulo.trim(), ano === null ? null : Number(ano), disponivel ? 1 : 0, Number(exemplares), autor_id === null ? null : Number(autor_id));
        const id = Number(result.lastInsertRowid);
        if (isbn || editora) this.db.prepare("INSERT INTO detalhes_livro (livro_id, isbn, editora) VALUES (?, ?, ?)").run(id, isbn, editora);
        const link = this.db.prepare("INSERT OR IGNORE INTO livros_categorias (livro_id, categoria_id) VALUES (?, ?)");
        for (const catId of categoria_ids) link.run(id, Number(catId));
        return id;
      });
      const id = create();
      res.status(201).json({ message: "Livro cadastrado com sucesso.", id });
    } catch (error) {
      if (String(error.code || "").includes("CONSTRAINT")) return res.status(400).json({ message: "Dados inválidos ou relacionamento inexistente." });
      next(error);
    }
  }

  replace(req, res, next) {
    try {
      const id = req.resourceId;
      const { titulo, ano = null, disponivel = true, exemplares = 1, autor_id = null } = req.body;
      if (typeof titulo !== "string" || !titulo.trim()) return res.status(400).json({ message: "O campo titulo é obrigatório." });
      const result = this.db.prepare("UPDATE livros SET titulo = ?, ano = ?, disponibilidade = ?, exemplares = ?, autor_id = ? WHERE id = ?").run(titulo.trim(), ano === null ? null : Number(ano), disponivel ? 1 : 0, Number(exemplares), autor_id === null ? null : Number(autor_id), id);
      if (!result.changes) return res.status(404).json({ message: "Livro não encontrado." });
      res.status(200).json({ message: "Livro atualizado.", id });
    } catch (error) { next(error); }
  }

  patch(req, res, next) {
    try {
      const id = req.resourceId;
      const allowed = { titulo: "titulo", ano: "ano", disponivel: "disponibilidade", exemplares: "exemplares", autor_id: "autor_id" };
      const entries = Object.entries(req.body).filter(([key]) => allowed[key]);
      if (!entries.length) return res.status(400).json({ message: "Envie ao menos um campo válido para atualizar." });
      const values = entries.map(([key, value]) => key === "disponivel" ? (value ? 1 : 0) : value);
      const set = entries.map(([key]) => `${allowed[key]} = ?`).join(", ");
      const result = this.db.prepare(`UPDATE livros SET ${set} WHERE id = ?`).run(...values, id);
      if (!result.changes) return res.status(404).json({ message: "Livro não encontrado." });
      res.status(200).json({ message: "Livro atualizado parcialmente.", id });
    } catch (error) { next(error); }
  }

  delete(req, res, next) {
    try {
      const result = this.db.prepare("DELETE FROM livros WHERE id = ?").run(req.resourceId);
      if (!result.changes) return res.status(404).json({ message: "Livro não encontrado." });
      res.status(200).json({ message: "Livro excluído com sucesso." });
    } catch (error) { next(error); }
  }

  authors(req, res, next) {
    try { res.json(this.db.prepare("SELECT * FROM autores ORDER BY nome").all()); }
    catch (error) { next(error); }
  }

  categories(req, res, next) {
    try { res.json(this.db.prepare("SELECT * FROM categorias ORDER BY nome").all()); }
    catch (error) { next(error); }
  }
}
