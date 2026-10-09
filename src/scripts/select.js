// comando: npm run db:select   (ou: node src/scripts/select.js)
// Consultas (READ) usando os relacionamentos entre as tabelas

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// .all() → retorna todas as linhas | .get() → retorna apenas a primeira linha

console.log("Todos os livros:");
console.table(db.prepare("SELECT * FROM livros").all());

console.log("Livro com id = 1:");
console.log(db.prepare("SELECT * FROM livros WHERE id = ?").get(1));

// 1:N → INNER JOIN entre livros e autores
console.log("Livros e seus autores (1:N):");
console.table(
  db
    .prepare(
      `
      SELECT livros.titulo, livros.ano, autores.nome AS autor
      FROM livros
      LEFT JOIN autores ON autores.id = livros.autor_id
      ORDER BY livros.ano
      `,
    )
    .all(),
);

// 1:1 → livros e detalhes_livro
console.log("Livros e seus detalhes (1:1):");
console.table(
  db
    .prepare(
      `
      SELECT livros.titulo, detalhes_livro.isbn, detalhes_livro.editora
      FROM livros
      INNER JOIN detalhes_livro ON detalhes_livro.livro_id = livros.id
      `,
    )
    .all(),
);

// N:N → livros, livros_categorias e categorias
console.log("Livros e suas categorias (N:N):");
console.table(
  db
    .prepare(
      `
      SELECT livros.titulo, GROUP_CONCAT(categorias.nome, ', ') AS categorias
      FROM livros
      INNER JOIN livros_categorias ON livros_categorias.livro_id = livros.id
      INNER JOIN categorias ON categorias.id = livros_categorias.categoria_id
      GROUP BY livros.id
      `,
    )
    .all(),
);

// Agregação: quantidade de livros por autor
console.log("Quantidade de livros por autor:");
console.table(
  db
    .prepare(
      `
      SELECT autores.nome, COUNT(livros.id) AS total
      FROM autores
      LEFT JOIN livros ON livros.autor_id = autores.id
      GROUP BY autores.id
      ORDER BY total DESC
      `,
    )
    .all(),
);

console.log("Usuários (ultimo_login convertido de Unix Timestamp):");
console.table(
  db
    .prepare("SELECT nome, email, datetime(ultimo_login, 'unixepoch') AS ultimo_login FROM usuarios")
    .all(),
);

db.close();
