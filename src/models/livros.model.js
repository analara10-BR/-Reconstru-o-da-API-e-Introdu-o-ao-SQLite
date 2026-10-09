import db from "../db_config/connection.js";

// Consulta base: junta livros + autores (1:N) + detalhes_livro (1:1) + categorias (N:N)
const SELECT_LIVROS = `
  SELECT l.id, l.titulo, l.ano, l.disponibilidade, l.exemplares, l.autor_id,
         a.nome AS autor, d.isbn, d.editora,
         GROUP_CONCAT(c.id) AS categoria_ids,
         GROUP_CONCAT(c.nome, '|') AS categorias
  FROM livros l
  LEFT JOIN autores a ON a.id = l.autor_id
  LEFT JOIN detalhes_livro d ON d.livro_id = l.id
  LEFT JOIN livros_categorias lc ON lc.livro_id = l.id
  LEFT JOIN categorias c ON c.id = lc.categoria_id
`;

// Converte a linha do banco para o formato JSON da API
const toLivro = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    titulo: row.titulo,
    ano: row.ano,
    disponivel: row.disponibilidade === 1,
    exemplares: row.exemplares,
    autor_id: row.autor_id,
    autor: row.autor,
    isbn: row.isbn,
    editora: row.editora,
    categoria_ids: row.categoria_ids ? row.categoria_ids.split(",").map(Number) : [],
    categorias: row.categorias ? row.categorias.split("|") : [],
  };
};

const salvarDetalhes = (livroId, isbn, editora) => {
  db.prepare(
    `
    INSERT INTO detalhes_livro (livro_id, isbn, editora)
    VALUES (?, ?, ?)
    ON CONFLICT(livro_id) DO UPDATE SET isbn = excluded.isbn, editora = excluded.editora
    `,
  ).run(livroId, isbn ?? null, editora ?? null);
};

const salvarCategorias = (livroId, categoriaIds) => {
  db.prepare("DELETE FROM livros_categorias WHERE livro_id = ?").run(livroId);
  const insert = db.prepare("INSERT INTO livros_categorias (livro_id, categoria_id) VALUES (?, ?)");
  for (const categoriaId of new Set(categoriaIds)) insert.run(livroId, categoriaId);
};

export default class LivrosModel {
  // READ - todos (com filtro opcional por título, autor ou categoria)
  findAll(busca = "") {
    const termo = `%${busca}%`;
    const rows = db
      .prepare(
        `${SELECT_LIVROS}
         WHERE (? = '' OR l.titulo LIKE ? OR a.nome LIKE ? OR c.nome LIKE ?)
         GROUP BY l.id
         ORDER BY l.id`,
      )
      .all(busca, termo, termo, termo);
    return rows.map(toLivro);
  }

  // READ - um pelo id
  findById(id) {
    const row = db.prepare(`${SELECT_LIVROS} WHERE l.id = ? GROUP BY l.id`).get(id);
    return toLivro(row);
  }

  // CREATE - insere livro, detalhes (1:1) e categorias (N:N) numa única transação
  create({ titulo, ano = null, disponivel = true, exemplares = 1, autor_id = null, categoria_ids = [], isbn, editora }) {
    const criar = db.transaction(() => {
      const result = db
        .prepare(
          `
          INSERT INTO livros (titulo, disponibilidade, ano, exemplares, autor_id)
          VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run(titulo.trim(), disponivel ? 1 : 0, ano, exemplares ?? 1, autor_id);
      const id = Number(result.lastInsertRowid);
      if (isbn !== undefined || editora !== undefined) salvarDetalhes(id, isbn, editora);
      salvarCategorias(id, categoria_ids);
      return id;
    });
    return this.findById(criar());
  }

  // UPDATE (PUT) - substitui o livro completo
  replace(id, { titulo, ano = null, disponivel = true, exemplares = 1, autor_id = null, categoria_ids, isbn, editora }) {
    const substituir = db.transaction(() => {
      const result = db
        .prepare(
          `
          UPDATE livros
          SET titulo = ?, disponibilidade = ?, ano = ?, exemplares = ?, autor_id = ?
          WHERE id = ?
          `,
        )
        .run(titulo.trim(), disponivel ? 1 : 0, ano, exemplares ?? 1, autor_id, id);
      if (result.changes === 0) return false;
      if (isbn !== undefined || editora !== undefined) salvarDetalhes(id, isbn, editora);
      if (categoria_ids !== undefined) salvarCategorias(id, categoria_ids);
      return true;
    });
    return substituir() ? this.findById(id) : null;
  }

  // UPDATE (PATCH) - altera apenas os campos enviados
  update(id, dados) {
    const atual = this.findById(id);
    if (!atual) return null;

    const colunas = { titulo: "titulo", ano: "ano", disponivel: "disponibilidade", exemplares: "exemplares", autor_id: "autor_id" };
    const campos = Object.keys(colunas).filter((campo) => dados[campo] !== undefined);

    const atualizar = db.transaction(() => {
      if (campos.length > 0) {
        const set = campos.map((campo) => `${colunas[campo]} = ?`).join(", ");
        const valores = campos.map((campo) => {
          if (campo === "disponivel") return dados.disponivel ? 1 : 0;
          if (campo === "titulo") return dados.titulo.trim();
          return dados[campo];
        });
        db.prepare(`UPDATE livros SET ${set} WHERE id = ?`).run(...valores, id);
      }
      if (dados.isbn !== undefined || dados.editora !== undefined) {
        salvarDetalhes(id, dados.isbn ?? atual.isbn, dados.editora ?? atual.editora);
      }
      if (dados.categoria_ids !== undefined) salvarCategorias(id, dados.categoria_ids);
    });
    atualizar();
    return this.findById(id);
  }

  // DELETE - detalhes_livro e livros_categorias são removidos por ON DELETE CASCADE
  remove(id) {
    const livro = this.findById(id);
    if (!livro) return null;
    db.prepare("DELETE FROM livros WHERE id = ?").run(id);
    return livro;
  }

  // N:N - vincula uma categoria ao livro
  addCategoria(livroId, categoriaId) {
    return db
      .prepare("INSERT OR IGNORE INTO livros_categorias (livro_id, categoria_id) VALUES (?, ?)")
      .run(livroId, categoriaId).changes;
  }

  // N:N - remove apenas o vínculo (não apaga livro nem categoria)
  removeCategoria(livroId, categoriaId) {
    return db
      .prepare("DELETE FROM livros_categorias WHERE livro_id = ? AND categoria_id = ?")
      .run(livroId, categoriaId).changes;
  }

  count() {
    return db.prepare("SELECT COUNT(*) AS total FROM livros").get().total;
  }
}
