// Testes automáticos da API (comando: npm test)
// Usam um banco separado (src/databases/test.db), sem mexer no info.db.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

process.env.DB_NAME = "test.db";
const dbFile = path.join(import.meta.dirname, "..", "src", "databases", "test.db");
for (const f of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) fs.rmSync(f, { force: true });

let server;
let baseUrl;
let db;

const request = async (method, url, body) => {
  const res = await fetch(baseUrl + url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, body: json, text };
};

before(async () => {
  console.log = () => {}; // silencia o middleware de debug e o populate
  console.table = () => {};
  console.error = () => {}; // erros esperados (500/400) registrados pelo errorHandler
  await import("../src/scripts/populate.js");
  const mod = await import("../src/app.js");
  db = mod.db;
  await new Promise((resolve) => {
    server = mod.default.listen(0, resolve);
  });
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => {
  server?.close();
  db?.close();
  for (const f of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) fs.rmSync(f, { force: true });
});

test("Lecture001: / e /equipe", async () => {
  assert.deepEqual((await request("GET", "/")).body, { message: "Servidor em Execução", success: true });
  const equipe = await request("GET", "/equipe");
  assert.equal(equipe.status, 200);
  assert.equal(equipe.body.length, 3);
});

test("Board: /api/info, middleware de id, 404 e 500", async () => {
  assert.equal((await request("GET", "/api/info")).status, 200);
  assert.deepEqual((await request("GET", "/api/info/42")).body, { message: "ID: 42" });
  assert.equal((await request("GET", "/api/info/ABC")).status, 400);
  assert.equal((await request("GET", "/api/info/7")).status, 500);
  const nf = await request("GET", "/api/nao-existe");
  assert.equal(nf.status, 404);
  assert.equal(nf.body.path, "/api/nao-existe");
});

test("N2: páginas EJS, arquivos estáticos e /api/home", async () => {
  for (const page of ["/home", "/about", "/contact", "/products", "/products/1"]) {
    const res = await request("GET", page);
    assert.equal(res.status, 200, page);
    assert.match(res.text, /<html/, page);
    assert.match(res.text, /navbar/, `${page} usa o layout com header`);
  }
  assert.equal((await request("GET", "/styles/site.css")).status, 200);
  assert.equal((await request("GET", "/scripts/products.js")).status, 200);
  assert.deepEqual((await request("GET", "/api/home")).body, { titulo: "Biblioteca Virtual" });
});

test("N2: /api/products lê os livros do SQLite", async () => {
  const lista = await request("GET", "/api/products");
  assert.equal(lista.status, 200);
  assert.equal(lista.body.productsList.length, 5);
  assert.equal(lista.body.productsList[0].nome, "Dom Casmurro");
  const um = await request("GET", "/api/products/3");
  assert.equal(um.body.nome, "1984");
  assert.equal(um.body.disponivel, false);
  assert.equal((await request("GET", "/api/products/999")).status, 404);
});

test("CRUD livros: GET com relacionamentos 1:N, 1:1 e N:N", async () => {
  const livro = (await request("GET", "/api/livros/1")).body;
  assert.equal(livro.autor, "Machado de Assis");
  assert.equal(livro.isbn, "978-85-359-0277-5");
  assert.deepEqual(livro.categorias, ["Romance", "Clássico"]);
  assert.equal((await request("GET", "/api/livros?q=rowling")).body.length, 2);
  assert.equal((await request("GET", "/api/livros/999")).status, 404);
  assert.equal((await request("GET", "/api/livros/abc")).status, 400);
});

test("CRUD livros: POST, PUT, PATCH e DELETE", async () => {
  const criado = await request("POST", "/api/livros", {
    titulo: "Claro Enigma",
    ano: 1951,
    disponivel: true,
    exemplares: 10,
    autor_id: 1,
    categoria_ids: [2],
    isbn: "123",
    editora: "X",
  });
  assert.equal(criado.status, 201);
  const id = criado.body.livro.id;
  assert.equal(criado.body.livro.exemplares, 10);
  assert.deepEqual(criado.body.livro.categorias, ["Clássico"]);

  const put = await request("PUT", `/api/livros/${id}`, { titulo: "Livro Atualizado", ano: 2000, disponivel: false, exemplares: 5 });
  assert.equal(put.status, 200);
  assert.equal(put.body.livro.titulo, "Livro Atualizado");
  assert.equal(put.body.livro.disponivel, false);
  assert.equal(put.body.livro.autor_id, null);

  const patch = await request("PATCH", `/api/livros/${id}`, { titulo: "Título Parcialmente Atualizado" });
  assert.equal(patch.status, 200);
  assert.equal(patch.body.livro.titulo, "Título Parcialmente Atualizado");
  assert.equal(patch.body.livro.ano, 2000);

  const del = await request("DELETE", `/api/livros/${id}`);
  assert.equal(del.status, 200);
  assert.equal((await request("GET", `/api/livros/${id}`)).status, 404);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM detalhes_livro WHERE livro_id = ?").get(id).n, 0, "CASCADE 1:1");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM livros_categorias WHERE livro_id = ?").get(id).n, 0, "CASCADE N:N");
});

test("CRUD livros: validações e chaves estrangeiras", async () => {
  assert.equal((await request("POST", "/api/livros", { ano: 1900 })).status, 400);
  assert.equal((await request("POST", "/api/livros", { titulo: "X", autor_id: 999 })).status, 400);
  assert.equal((await request("PATCH", "/api/livros/1", {})).status, 400);
  assert.equal((await request("PUT", "/api/livros/999", { titulo: "X" })).status, 404);
  assert.equal((await request("DELETE", "/api/livros/999")).status, 404);
  const res = await fetch(`${baseUrl}/api/livros`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{ruim" });
  assert.equal(res.status, 400);
});

test("N:N: vincular e desvincular categoria", async () => {
  const add = await request("POST", "/api/livros/2/categorias/4");
  assert.equal(add.status, 201);
  assert.ok(add.body.livro.categorias.includes("Fantasia"));
  const rem = await request("DELETE", "/api/livros/2/categorias/4");
  assert.equal(rem.status, 200);
  assert.ok(!rem.body.livro.categorias.includes("Fantasia"));
  assert.equal((await request("DELETE", "/api/livros/2/categorias/4")).status, 404);
});

test("Autores, categorias e usuários", async () => {
  const autor = await request("POST", "/api/autores", { nome: "Clarice Lispector" });
  assert.equal(autor.status, 201);
  assert.equal((await request("PUT", `/api/autores/${autor.body.autor.id}`, { nome: "C. Lispector" })).body.autor.nome, "C. Lispector");

  // ON DELETE SET NULL: o livro continua existindo sem autor
  assert.equal((await request("DELETE", "/api/autores/3")).status, 200);
  const hp = (await request("GET", "/api/livros/4")).body;
  assert.equal(hp.autor_id, null);

  const cat = await request("POST", "/api/categorias", { nome: "Poesia" });
  assert.equal(cat.status, 201);
  assert.equal((await request("DELETE", `/api/categorias/${cat.body.categoria.id}`)).status, 200);
  assert.equal((await request("POST", "/api/categorias", {})).status, 400);

  assert.equal((await request("GET", "/api/usuarios")).body.length, 2);
  const dup = await request("POST", "/api/usuarios", { nome: "Zé", email: "ze@email.com" });
  assert.equal(dup.status, 400, "email UNIQUE");
  const novo = await request("POST", "/api/usuarios", { nome: "Maria", email: "maria@email.com", idade: 20 });
  assert.equal(novo.status, 201);
  assert.equal((await request("DELETE", `/api/usuarios/${novo.body.usuario.id}`)).status, 200);
});
