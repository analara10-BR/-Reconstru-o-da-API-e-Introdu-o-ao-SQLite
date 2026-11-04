// comando: npm run db:update   (ou: node src/scripts/update.js)

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// Atualizar a disponibilidade de um produto
// SET → o que muda
// WHERE → SEMPRE obrigatório (sem WHERE, TODAS as linhas seriam alteradas!)
db.prepare(
  `
  UPDATE produto
  SET disponibilidade = ?
  WHERE id_produto = ?
`,
).run(0, 1); // produto 1 agora está vendido

// Atualizar vários campos de uma vez
db.prepare(
  `
  UPDATE produto
  SET nome = ?, preco = ?
  WHERE id_produto = ?
`,
).run("Calça Jeans 501 Original", 89.9, 3);

// UPDATE usando condição: atualiza vários registros
const baratos = db
  .prepare(
    `
  UPDATE produto
  SET estado_conservacao = 'Promoção'
  WHERE preco < 70
`,
  )
  .run();
console.log(`Produtos marcados como promoção: ${baratos.changes}`);

// Trocar a categoria de um produto (a categoria 2 precisa existir: FOREIGN KEY em ação)
db.prepare("UPDATE produto SET id_categoria = ? WHERE id_produto = ?").run(2, 1);

// Tentativa de usar uma categoria inexistente: a FOREIGN KEY impede
try {
  db.prepare("UPDATE produto SET id_categoria = ? WHERE id_produto = ?").run(999, 1);
} catch (error) {
  console.log(`FOREIGN KEY bloqueou a atualização: ${error.message}`);
}

// Mudar o status de um pedido
db.prepare("UPDATE pedido SET status = ? WHERE id_pedido = ?").run("pago", 2);

console.table(db.prepare("SELECT id_produto, nome, preco, estado_conservacao, disponibilidade, id_categoria FROM produto").all());
db.close();
