// comando: npm run db:delete   (ou: node src/scripts/delete.js)
// Dica: rode "npm run db:populate" depois para restaurar os dados.

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// Deletar um livro pelo ID
db.prepare(
  `
  DELETE FROM livros
  WHERE id = ?
`,
).run(5);

// Deletar livros indisponíveis
db.prepare(
  `
  DELETE FROM livros
  WHERE disponibilidade = 0
`,
).run();

// DELETE com relacionamento (N:N)
// Remover relação livro ↔ categoria
// Remove apenas o vínculo
// Não apaga livro nem categoria
db.prepare(
  `
  DELETE FROM livros_categorias
  WHERE livro_id = ? AND categoria_id = ?
`,
).run(1, 2);

// DELETE respeitando integridade referencial
// Deletar um livro + suas relações (forma segura)
// 1) remove relacionamentos N:N
// Ordem importa
// Foreign keys impedem erros
db.prepare(
  `
  DELETE FROM livros_categorias
  WHERE livro_id = ?
`,
).run(3);

// 2) remove detalhes (1:1)
db.prepare(
  `
  DELETE FROM detalhes_livro
  WHERE livro_id = ?
`,
).run(3);

// 3) remove o livro
db.prepare(
  `
  DELETE FROM livros
  WHERE id = ?
`,
).run(3);

console.log("livros");
console.table(db.prepare("SELECT * FROM livros").all());
console.log("detalhes_livro");
console.table(db.prepare("SELECT * FROM detalhes_livro").all());
console.log("livros_categorias");
console.table(db.prepare("SELECT * FROM livros_categorias").all());

db.close();
