// comando: npm run db:update   (ou: node src/scripts/update.js)

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// Atualizar a disponibilidade de um produto
// SET → o que muda
// WHERE → SEMPRE obrigatório (reforçar!)
const stmt = db.prepare(`
  UPDATE produtos
  SET disponibilidade = ?
  WHERE id = ?
`);

stmt.run(0, 1); // produto 1 agora está vendido

// Atualizar o nome de um produto
db.prepare(
  `
  UPDATE produtos
  SET nome = ?
  WHERE id = ?
`,
).run("Vestido Floral Midi (Promoção)", 1);

// Atualizar vários campos de uma vez
db.prepare(
  `
  UPDATE produtos
  SET nome = ?, preco = ?
  WHERE id = ?
`,
).run("Calça Jeans 501 Original", 89.9, 3);

// UPDATE usando condição
// Atualizar disponibilidade de produtos baratos
// Atualiza vários registros
// run() sem parâmetros adicionais
const antigos = db
  .prepare(
    `
  UPDATE produtos
  SET disponibilidade = 0
  WHERE preco < 70
`,
  )
  .run();
console.log(`Produtos antigos marcados como indisponíveis: ${antigos.changes}`);

// Trocar a marca de um produto
// marca_id deve existir
// Foreign key em ação
db.prepare(
  `
  UPDATE produtos
  SET marca_id = ?
  WHERE id = ?
`,
).run(2, 1); // Vestido Floral agora associado à marca 2

// Tentativa de usar uma marca inexistente: a FOREIGN KEY impede
try {
  db.prepare("UPDATE produtos SET marca_id = ? WHERE id = ?").run(999, 1);
} catch (error) {
  console.log(`FOREIGN KEY bloqueou a atualização: ${error.message}`);
}

console.table(db.prepare("SELECT * FROM produtos").all());
db.close();
