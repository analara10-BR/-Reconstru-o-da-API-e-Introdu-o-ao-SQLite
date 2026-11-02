// comando: npm run db:delete   (ou: node src/scripts/delete.js)
// Dica: rode "npm run db:populate" depois para restaurar os dados.

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// Deletar um produto pelo ID (WHERE pela PK). O produto 4 não está em nenhum pedido.
db.prepare(
  `
  DELETE FROM produto
  WHERE id_produto = ?
`,
).run(4);

// DELETE bloqueado pela FOREIGN KEY:
// o produto 3 está em item_pedido, então o SQLite não deixa apagar (preserva o histórico da venda)
try {
  db.prepare("DELETE FROM produto WHERE id_produto = ?").run(3);
} catch (error) {
  console.log(`FOREIGN KEY bloqueou o DELETE do produto 3: ${error.message}`);
}

// DELETE com ON DELETE CASCADE:
// ao apagar o pedido 1, os itens, pagamentos e a entrega dele são apagados junto
db.prepare("DELETE FROM pedido WHERE id_pedido = ?").run(1);

// Agora o produto 3 não está mais em nenhum pedido e pode ser apagado
db.prepare("DELETE FROM produto WHERE id_produto = ?").run(3);

console.log("produto");
console.table(db.prepare("SELECT id_produto, nome FROM produto").all());
console.log("item_pedido");
console.table(db.prepare("SELECT * FROM item_pedido").all());
console.log("entrega");
console.table(db.prepare("SELECT * FROM entrega").all());

db.close();
