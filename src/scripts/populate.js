// comando: npm run db:populate   (ou: node src/scripts/populate.js)

import { createDatabase } from "../db_config/database.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

console.log("Populando o banco de dados...");

// Limpa os dados anteriores para o script poder ser executado várias vezes
// (a ordem importa por causa das chaves estrangeiras)
db.exec(`
  DELETE FROM livros_categorias;
  DELETE FROM detalhes_livro;
  DELETE FROM livros;
  DELETE FROM categorias;
  DELETE FROM autores;
  DELETE FROM usuarios;
  DELETE FROM sqlite_sequence;
`);

/* =========================
   AUTORES (1:N)
========================= */
const insertAutor = db.prepare(`
  INSERT INTO autores (nome)
  VALUES (?)
`);

insertAutor.run("Machado de Assis");
insertAutor.run("George Orwell");
insertAutor.run("J. K. Rowling");

console.log("autores");
let temp = db.prepare("SELECT * FROM autores").all();
console.log(temp);

/* =========================
   LIVROS
========================= */
const insertLivro = db.prepare(`
  INSERT INTO livros (titulo, disponibilidade, ano, autor_id)
  VALUES (?, ?, ?, ?)
`);

insertLivro.run("Dom Casmurro", 1, 1899, 1);
insertLivro.run("Memórias Póstumas de Brás Cubas", 1, 1881, 1);
insertLivro.run("1984", 0, 1949, 2);
insertLivro.run("Harry Potter e a Pedra Filosofal", 1, 1997, 3);
insertLivro.run("Outro Livro", 1, 1997, 3);

console.log("livros");
temp = db.prepare("SELECT * FROM livros").all();
console.log(temp);

/* =========================
   DETALHES DO LIVRO (1:1)
========================= */
const insertDetalhes = db.prepare(`
  INSERT INTO detalhes_livro (livro_id, isbn, editora)
  VALUES (?, ?, ?)
`);

insertDetalhes.run(1, "978-85-359-0277-5", "Editora Globo");
insertDetalhes.run(2, "978-85-359-0278-2", "Editora Globo");
insertDetalhes.run(3, "978-0-452-28423-4", "Secker & Warburg");
insertDetalhes.run(4, "978-85-325-3050-1", "Rocco");

console.log("detalhes_livro");
temp = db.prepare("SELECT * FROM detalhes_livro").all();
console.log(temp);

/* =========================
   CATEGORIAS (N:N)
========================= */
const insertCategoria = db.prepare(`
  INSERT INTO categorias (nome)
  VALUES (?)
`);

insertCategoria.run("Romance");
insertCategoria.run("Clássico");
insertCategoria.run("Ficção Científica");
insertCategoria.run("Fantasia");

console.log("categorias");
temp = db.prepare("SELECT * FROM categorias").all();
console.log(temp);

/* =========================
   LIVROS ↔ CATEGORIAS (N:N)
========================= */
const insertLivroCategoria = db.prepare(`
  INSERT INTO livros_categorias (livro_id, categoria_id)
  VALUES (?, ?)
`);

insertLivroCategoria.run(1, 1);
insertLivroCategoria.run(1, 2);
insertLivroCategoria.run(2, 2);
insertLivroCategoria.run(3, 3);
insertLivroCategoria.run(3, 2);
insertLivroCategoria.run(4, 4);

console.log("livros_categorias");
temp = db.prepare("SELECT * FROM livros_categorias").all();
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
