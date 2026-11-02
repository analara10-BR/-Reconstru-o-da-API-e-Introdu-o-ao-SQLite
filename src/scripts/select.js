// comando: npm run db:select   (ou: node src/scripts/select.js)
// Consultas (READ) usando os relacionamentos do DER

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// .all() → retorna todas as linhas | .get() → retorna apenas a primeira linha

console.log("Todos os produtos:");
console.table(db.prepare("SELECT id_produto, nome, preco, disponibilidade FROM produto").all());

console.log("Produto com id = 1 (WHERE pela PK):");
console.log(db.prepare("SELECT * FROM produto WHERE id_produto = ?").get(1));

// CATEGORIA 1:N PRODUTO e FORNECEDOR 1:N PRODUTO → INNER JOIN pelas FKs
console.log("Produtos com categoria e fornecedor:");
console.table(
  db
    .prepare(
      `
      SELECT p.nome, p.preco, c.nome AS categoria, f.nome AS fornecedor
      FROM produto p
      INNER JOIN categoria c  ON c.id_categoria  = p.id_categoria
      INNER JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor
      ORDER BY p.preco
      `,
    )
    .all(),
);

// PEDIDO N:N PRODUTO → passa pela tabela associativa item_pedido
console.log("Itens de cada pedido (N:N através de item_pedido):");
console.table(
  db
    .prepare(
      `
      SELECT pe.id_pedido, cl.nome AS cliente, pr.nome AS produto, i.quantidade, i.preco_unitario,
             pe.codigo_cupom
      FROM pedido pe
      INNER JOIN cliente cl    ON cl.id_cliente = pe.id_cliente
      INNER JOIN item_pedido i ON i.id_pedido   = pe.id_pedido
      INNER JOIN produto pr    ON pr.id_produto = i.id_produto
      ORDER BY pe.id_pedido
      `,
    )
    .all(),
);

// LEFT JOIN: mostra também pedidos SEM entrega e SEM pagamento (aparecem como NULL)
console.log("Pedidos com pagamento e entrega (LEFT JOIN):");
console.table(
  db
    .prepare(
      `
      SELECT pe.id_pedido, pe.status, pg.forma_pagamento, pg.valor_pago, e.situacao AS entrega
      FROM pedido pe
      LEFT JOIN pagamento pg ON pg.id_pedido = pe.id_pedido
      LEFT JOIN entrega e    ON e.id_pedido  = pe.id_pedido
      `,
    )
    .all(),
);

// Agregação: quantidade de produtos por categoria
console.log("Quantidade de produtos por categoria:");
console.table(
  db
    .prepare(
      `
      SELECT c.nome, COUNT(p.id_produto) AS total
      FROM categoria c
      LEFT JOIN produto p ON p.id_categoria = c.id_categoria
      GROUP BY c.id_categoria
      ORDER BY total DESC
      `,
    )
    .all(),
);

// Nunca selecione senha_hash em telas ou relatórios
console.log("Clientes e quantidade de endereços (CLIENTE 1:N ENDERECO):");
console.table(
  db
    .prepare(
      `
      SELECT cl.nome, cl.email, COUNT(en.id_endereco) AS enderecos
      FROM cliente cl
      LEFT JOIN endereco en ON en.id_cliente = cl.id_cliente
      GROUP BY cl.id_cliente
      `,
    )
    .all(),
);

db.close();
