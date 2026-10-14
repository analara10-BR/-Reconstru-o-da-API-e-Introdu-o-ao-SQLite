// comando: npm run db:populate   (ou: node src/scripts/populate.js)

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

console.log("Populando o banco de dados...");

// Limpa os dados anteriores para o script poder ser executado várias vezes
// (a ordem importa por causa das chaves estrangeiras)
db.exec(`
  DELETE FROM produtos_categorias;
  DELETE FROM detalhes_produto;
  DELETE FROM produtos;
  DELETE FROM categorias;
  DELETE FROM marcas;
  DELETE FROM usuarios;
  DELETE FROM sqlite_sequence;
`);

/* =========================
   MARCAS (1:N)
========================= */
const insertMarca = db.prepare(`
  INSERT INTO marcas (nome)
  VALUES (?)
`);

insertMarca.run("Zara");
insertMarca.run("Levi's");
insertMarca.run("Nike");

console.log("marcas");
let temp = db.prepare("SELECT * FROM marcas").all();
console.log(temp);

/* =========================
   PRODUTOS
========================= */
const insertProduto = db.prepare(`
  INSERT INTO produtos (nome, disponibilidade, preco, estoque, marca_id)
  VALUES (?, ?, ?, ?, ?)
`);

insertProduto.run("Vestido Floral Midi", 1, 59.9, 1, 1);
insertProduto.run("Blazer Alfaiataria Bege", 1, 89.9, 1, 1);
insertProduto.run("Calça Jeans 501", 0, 79.9, 0, 2);
insertProduto.run("Tênis Air Max 90", 1, 149.9, 2, 3);
insertProduto.run("Moletom Vintage", 1, 69.9, 1, 3);

console.log("produtos");
temp = db.prepare("SELECT * FROM produtos").all();
console.log(temp);

/* =========================
   DETALHES DO PRODUTO (1:1)
========================= */
const insertDetalhes = db.prepare(`
  INSERT INTO detalhes_produto (produto_id, tamanho, condicao)
  VALUES (?, ?, ?)
`);

insertDetalhes.run(1, "M", "Seminovo");
insertDetalhes.run(2, "G", "Ótimo estado");
insertDetalhes.run(3, "40", "Bom estado");
insertDetalhes.run(4, "39", "Seminovo");

console.log("detalhes_produto");
temp = db.prepare("SELECT * FROM detalhes_produto").all();
console.log(temp);

/* =========================
   CATEGORIAS (N:N)
========================= */
const insertCategoria = db.prepare(`
  INSERT INTO categorias (nome)
  VALUES (?)
`);

insertCategoria.run("Feminino");
insertCategoria.run("Vintage");
insertCategoria.run("Masculino");
insertCategoria.run("Esportivo");

console.log("categorias");
temp = db.prepare("SELECT * FROM categorias").all();
console.log(temp);

/* =========================
   PRODUTOS ↔ CATEGORIAS (N:N)
========================= */
const insertProdutoCategoria = db.prepare(`
  INSERT INTO produtos_categorias (produto_id, categoria_id)
  VALUES (?, ?)
`);

insertProdutoCategoria.run(1, 1);
insertProdutoCategoria.run(1, 2);
insertProdutoCategoria.run(2, 2);
insertProdutoCategoria.run(3, 3);
insertProdutoCategoria.run(3, 2);
insertProdutoCategoria.run(4, 4);

console.log("produtos_categorias");
temp = db.prepare("SELECT * FROM produtos_categorias").all();
console.log(temp);

/* =========================
   USUÁRIOS
========================= */
// strftime('%s','now')
// Ele faz duas coisas:
// now → data/hora atual
// %s → converte para Unix Timestamp
db.prepare(
  `
  INSERT INTO usuarios (nome, email, idade, altura, ativo, saldo, ultimo_login)
  VALUES ('José Silva', 'ze@email.com', 35, 1.75, 1, 250.75, strftime('%s','now'));
  `,
).run();

db.prepare(
  `
  INSERT INTO usuarios (nome, email, idade, altura, ativo, saldo, ultimo_login)
  VALUES ('João Silva', 'joao@email.com', 35, 1.75, 1, 250.75, strftime('%s', '2015-08-10 16:35:00'));
  `,
).run();

console.log("usuarios");
temp = db.prepare("SELECT * FROM usuarios").all();
console.log(temp);

console.log("Banco populado com sucesso!");
db.close();
