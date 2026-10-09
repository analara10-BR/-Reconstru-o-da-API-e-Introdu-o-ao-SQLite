// comando: npm run db:delete   (ou: node src/scripts/delete.js)
// Dica: rode "npm run db:populate" depois para restaurar os dados.

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// Deletar um produto pelo ID
db.prepare(
  `
  DELETE FROM produtos
  WHERE id = ?
`,
).run(5);

// Deletar produtos indisponíveis
db.prepare(
  `
  DELETE FROM produtos
  WHERE disponibilidade = 0
`,
).run();

// DELETE com relacionamento (N:N)
// Remover relação produto ↔ categoria
// Remove apenas o vínculo
// Não apaga produto nem categoria
db.prepare(
  `
  DELETE FROM produtos_categorias
  WHERE produto_id = ? AND categoria_id = ?
`,
).run(1, 2);

// DELETE respeitando integridade referencial
// Deletar um produto + suas relações (forma segura)
// 1) remove relacionamentos N:N
// Ordem importa
// Foreign keys impedem erros
db.prepare(
  `
  DELETE FROM produtos_categorias
  WHERE produto_id = ?
`,
).run(3);

// 2) remove detalhes (1:1)
db.prepare(
  `
  DELETE FROM detalhes_produto
  WHERE produto_id = ?
`,
).run(3);

// 3) remove o produto
db.prepare(
  `
  DELETE FROM produtos
  WHERE id = ?
`,
).run(3);

console.log("produtos");
console.table(db.prepare("SELECT * FROM produtos").all());
console.log("detalhes_produto");
console.table(db.prepare("SELECT * FROM detalhes_produto").all());
console.log("produtos_categorias");
console.table(db.prepare("SELECT * FROM produtos_categorias").all());

db.close();
