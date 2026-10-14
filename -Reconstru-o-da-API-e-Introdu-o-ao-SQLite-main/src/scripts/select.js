// comando: npm run db:select   (ou: node src/scripts/select.js)
// Consultas (READ) usando os relacionamentos entre as tabelas

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

// .all() → retorna todas as linhas | .get() → retorna apenas a primeira linha

console.log("Todos os produtos:");
console.table(db.prepare("SELECT * FROM produtos").all());

console.log("Produto com id = 1:");
console.log(db.prepare("SELECT * FROM produtos WHERE id = ?").get(1));

// 1:N → INNER JOIN entre produtos e marcas
console.log("Produtos e suas marcas (1:N):");
console.table(
  db
    .prepare(
      `
      SELECT produtos.nome, produtos.preco, marcas.nome AS marca
      FROM produtos
      LEFT JOIN marcas ON marcas.id = produtos.marca_id
      ORDER BY produtos.preco
      `,
    )
    .all(),
);

// 1:1 → produtos e detalhes_produto
console.log("Produtos e seus detalhes (1:1):");
console.table(
  db
    .prepare(
      `
      SELECT produtos.nome, detalhes_produto.tamanho, detalhes_produto.condicao
      FROM produtos
      INNER JOIN detalhes_produto ON detalhes_produto.produto_id = produtos.id
      `,
    )
    .all(),
);

// N:N → produtos, produtos_categorias e categorias
console.log("Produtos e suas categorias (N:N):");
console.table(
  db
    .prepare(
      `
      SELECT produtos.nome, GROUP_CONCAT(categorias.nome, ', ') AS categorias
      FROM produtos
      INNER JOIN produtos_categorias ON produtos_categorias.produto_id = produtos.id
      INNER JOIN categorias ON categorias.id = produtos_categorias.categoria_id
      GROUP BY produtos.id
      `,
    )
    .all(),
);

// Agregação: quantidade de produtos por marca
console.log("Quantidade de produtos por marca:");
console.table(
  db
    .prepare(
      `
      SELECT marcas.nome, COUNT(produtos.id) AS total
      FROM marcas
      LEFT JOIN produtos ON produtos.marca_id = marcas.id
      GROUP BY marcas.id
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
