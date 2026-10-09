// comando: npm run db:update   (ou: node src/scripts/update.js)

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// Atualizar a disponibilidade de um livro
// SET → o que muda
// WHERE → SEMPRE obrigatório (reforçar!)
const stmt = db.prepare(`
  UPDATE livros
  SET disponibilidade = ?
  WHERE id = ?
`);

stmt.run(0, 1); // livro 1 agora está emprestado

// Atualizar o título de um livro
db.prepare(
  `
  UPDATE livros
  SET titulo = ?
  WHERE id = ?
`,
).run("Dom Casmurro (Edição Escolar)", 1);

// Atualizar vários campos de uma vez
db.prepare(
  `
  UPDATE livros
  SET titulo = ?, ano = ?
  WHERE id = ?
`,
).run("1984", 1950, 3);

// UPDATE usando condição
// Atualizar disponibilidade de livros antigos
// Atualiza vários registros
// run() sem parâmetros adicionais
const antigos = db
  .prepare(
    `
  UPDATE livros
  SET disponibilidade = 0
  WHERE ano < 1900
`,
  )
  .run();
console.log(`Livros antigos marcados como indisponíveis: ${antigos.changes}`);

// Trocar o autor de um livro
// autor_id deve existir
// Foreign key em ação
db.prepare(
  `
  UPDATE livros
  SET autor_id = ?
  WHERE id = ?
`,
).run(2, 1); // Dom Casmurro agora associado ao autor 2

// Tentativa de usar um autor inexistente: a FOREIGN KEY impede
try {
  db.prepare("UPDATE livros SET autor_id = ? WHERE id = ?").run(999, 1);
} catch (error) {
  console.log(`FOREIGN KEY bloqueou a atualização: ${error.message}`);
}

console.table(db.prepare("SELECT * FROM livros").all());
db.close();
