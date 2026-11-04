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

// Faz a requisição e devolve status, JSON e o cookie de sessão (se o servidor enviar um)
const request = async (method, url, body, cookie) => {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(baseUrl + url, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: "manual" });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, body: json, text, cookie: setCookie ? setCookie.split(";")[0] : null, location: res.headers.get("location") };
};

const login = async (email, senha = "brecho123") => (await request("POST", "/api/auth/login", { email, senha })).cookie;

// Imagem PNG de 1x1 pixel em base64 (simula a foto enviada pelo formulário)
const PNG_1PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

before(async () => {
  console.log = () => {}; // silencia o middleware de debug e o populate
  console.table = () => {};
  console.error = () => {}; // erros esperados (500/400) registrados pelo errorHandler
  console.warn = () => {};
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
  assert.deepEqual((await request("GET", "/api/home")).body, { titulo: "Brechó Online" });
});

test("N2: /api/products lê os produtos do SQLite", async () => {
  const lista = await request("GET", "/api/products");
  assert.equal(lista.status, 200);
  assert.equal(lista.body.productsList.length, 5);
  assert.equal(lista.body.productsList[0].nome, "Vestido Floral Midi");
  assert.equal(lista.body.productsList[0].categoria, "Feminino");
  assert.equal(lista.body.productsList[0].fornecedor, "Acervo Brechó Raiz");
  const um = await request("GET", "/api/products/3");
  assert.equal(um.body.nome, "Calça Jeans 501");
  assert.equal(um.body.disponivel, false);
  assert.equal(um.body.pode_editar, false);
  assert.equal((await request("GET", "/api/products/999")).status, 404);
});

test("Páginas de login e cadastro; header muda com a sessão", async () => {
  for (const page of ["/login", "/cadastro"]) {
    const res = await request("GET", page);
    assert.equal(res.status, 200, page);
    assert.match(res.text, /editor-card/, `${page} usa os estilos existentes`);
  }
  const anonimo = await request("GET", "/products");
  assert.match(anonimo.text, /href="\/login">Entrar</);
  assert.match(anonimo.text, /Para anunciar, entre na sua conta/);
  assert.doesNotMatch(anonimo.text, /id="form-produto"/, "formulário escondido sem login");

  const cookie = await login("ze@email.com");
  const logado = await request("GET", "/products", null, cookie);
  assert.match(logado.text, /Olá, José/);
  assert.match(logado.text, /id="btn-sair"/);
  assert.match(logado.text, /id="form-produto"/);
  const redirect = await request("GET", "/login", null, cookie);
  assert.equal(redirect.status, 302, "logado não precisa ver a tela de login");
});

test("Cadastro de cliente: sucesso, hash da senha e sessão iniciada", async () => {
  const res = await request("POST", "/api/auth/cadastro", {
    nome: "Ana Lara", email: "Ana@Email.com", telefone: "(85) 98888-7777", senha: "segredo1", confirmar_senha: "segredo1",
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.cliente.email, "ana@email.com", "e-mail salvo em minúsculas");
  assert.equal(res.body.cliente.senha_hash, undefined, "a API nunca devolve a senha/hash");
  assert.ok(res.cookie, "cookie de sessão enviado");

  const linha = db.prepare("SELECT senha_hash FROM cliente WHERE email = ?").get("ana@email.com");
  assert.notEqual(linha.senha_hash, "segredo1", "senha não fica em texto puro");
  assert.match(linha.senha_hash, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/, "formato scrypt$salt$hash");

  const me = await request("GET", "/api/auth/me", null, res.cookie);
  assert.equal(me.status, 200);
  assert.equal(me.body.cliente.nome, "Ana Lara");
});

test("Cadastro de cliente: campos obrigatórios, formato e e-mail duplicado", async () => {
  const vazio = await request("POST", "/api/auth/cadastro", {});
  assert.equal(vazio.status, 400);
  assert.equal(vazio.body.erros.length, 4, "nome, e-mail, telefone e senha");
  const invalido = await request("POST", "/api/auth/cadastro", { nome: "X Y", email: "sem-arroba", telefone: "abc", senha: "123" });
  assert.equal(invalido.status, 400);
  const confere = await request("POST", "/api/auth/cadastro", { nome: "Nay", email: "nay@email.com", telefone: "85999990000", senha: "123456", confirmar_senha: "654321" });
  assert.equal(confere.status, 400);
  assert.ok(confere.body.erros.includes("As senhas não conferem."));
  const dup = await request("POST", "/api/auth/cadastro", { nome: "Outro José", email: "ZE@email.com", telefone: "85999990000", senha: "123456" });
  assert.equal(dup.status, 409, "e-mail duplicado (sem diferenciar maiúsculas)");
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM cliente WHERE email = 'ze@email.com'").get().n, 1);
});

test("Login válido, login inválido e logout", async () => {
  const ok = await request("POST", "/api/auth/login", { email: "ze@email.com", senha: "brecho123" });
  assert.equal(ok.status, 200);
  assert.ok(ok.cookie);
  assert.match(ok.cookie, /^brecho\.sid=/);

  const senhaErrada = await request("POST", "/api/auth/login", { email: "ze@email.com", senha: "errada" });
  assert.equal(senhaErrada.status, 401);
  assert.equal(senhaErrada.cookie, null, "login inválido não cria sessão");
  const emailInexistente = await request("POST", "/api/auth/login", { email: "ninguem@email.com", senha: "brecho123" });
  assert.equal(emailInexistente.status, 401);
  assert.equal(emailInexistente.body.message, senhaErrada.body.message, "mesma mensagem nos dois casos");
  assert.equal((await request("POST", "/api/auth/login", {})).status, 400);

  assert.equal((await request("GET", "/api/auth/me", null, ok.cookie)).status, 200);
  const sair = await request("POST", "/api/auth/logout", null, ok.cookie);
  assert.equal(sair.status, 200);
  assert.equal((await request("GET", "/api/auth/me", null, ok.cookie)).status, 401, "sessão destruída");
  const depois = await request("POST", "/api/produtos", { nome: "X", preco: 1, id_categoria: 1 }, ok.cookie);
  assert.equal(depois.status, 401, "cookie antigo não serve depois do logout");
});

test("Anúncio: bloqueado sem login (401)", async () => {
  const antes = db.prepare("SELECT COUNT(*) AS n FROM produto").get().n;
  const res = await request("POST", "/api/produtos", { nome: "Saia", preco: 10, id_categoria: 1 });
  assert.equal(res.status, 401);
  assert.equal(res.body.login, "/login");
  assert.equal((await request("PATCH", "/api/produtos/1", { nome: "Hack" })).status, 401);
  assert.equal((await request("DELETE", "/api/produtos/1")).status, 401);
  assert.equal((await request("POST", "/api/categorias", { nome: "X" })).status, 401);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM produto").get().n, antes, "nada foi gravado");
});

test("Anúncio: cliente logado cadastra, salva no SQLite e aparece no catálogo", async () => {
  const cookie = await login("joao@email.com");
  const criado = await request("POST", "/api/produtos", {
    nome: "Saia Plissada", descricao: "Saia midi plissada", tamanho: "P", preco: 49.9,
    estado_conservacao: "Ótimo estado", disponibilidade: true, id_categoria: 2, foto: PNG_1PX,
  }, cookie);
  assert.equal(criado.status, 201);
  const p = criado.body.produto;
  assert.equal(p.categoria, "Vintage");
  assert.match(p.imagem_url, /^\/uploads\/[0-9a-f-]+\.png$/);
  assert.equal((await request("GET", p.imagem_url)).status, 200, "foto servida pelo express.static");

  // O anúncio ficou ligado a um FORNECEDOR que pertence ao cliente João (id 2)
  const linha = db.prepare(`
    SELECT p.*, f.id_cliente FROM produto p JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor WHERE p.id_produto = ?
  `).get(p.id_produto);
  assert.equal(linha.nome, "Saia Plissada");
  assert.equal(linha.preco, 49.9);
  assert.equal(linha.tamanho, "P");
  assert.equal(linha.estado_conservacao, "Ótimo estado");
  assert.equal(linha.disponibilidade, 1);
  assert.equal(linha.id_cliente, 2);

  const catalogo = await request("GET", "/api/products", null, cookie);
  const card = catalogo.body.productsList.find((x) => x.id === p.id_produto);
  assert.ok(card, "aparece no catálogo");
  assert.equal(card.fornecedor, "João Silva");
  assert.equal(card.pode_editar, true);

  // Segundo anúncio reaproveita o mesmo fornecedor
  const outro = await request("POST", "/api/produtos", { nome: "Cinto", preco: 15, id_categoria: 1, imagem_url: "https://exemplo.com/cinto.jpg" }, cookie);
  assert.equal(outro.body.produto.id_fornecedor, p.id_fornecedor);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM fornecedor WHERE id_cliente = 2").get().n, 1);

  fs.rmSync(path.join(import.meta.dirname, "..", "public", p.imagem_url), { force: true });
});

test("Anúncio: dono edita (PUT/PATCH) e exclui; outra pessoa recebe 403", async () => {
  const dono = await login("joao@email.com");
  const outra = await login("ze@email.com");
  const id = (await request("POST", "/api/produtos", { nome: "Camisa", preco: 30, id_categoria: 3 }, dono)).body.produto.id_produto;

  assert.equal((await request("PATCH", `/api/produtos/${id}`, { preco: 1 }, outra)).status, 403);
  assert.equal((await request("DELETE", `/api/produtos/${id}`, null, outra)).status, 403);
  assert.equal((await request("PATCH", "/api/produtos/1", { preco: 1 }, dono)).status, 403, "acervo da loja não é do João");

  const put = await request("PUT", `/api/produtos/${id}`, { nome: "Camisa Linho", preco: 35, id_categoria: 1, disponibilidade: false }, dono);
  assert.equal(put.status, 200);
  assert.equal(put.body.produto.nome, "Camisa Linho");
  assert.equal(put.body.produto.disponibilidade, false);
  const patch = await request("PATCH", `/api/produtos/${id}`, { tamanho: "M" }, dono);
  assert.equal(patch.body.produto.tamanho, "M");
  assert.equal(patch.body.produto.preco, 35);

  assert.equal((await request("DELETE", `/api/produtos/${id}`, null, dono)).status, 200);
  assert.equal((await request("GET", `/api/produtos/${id}`)).status, 404);
});

test("Anúncio: validações e chaves estrangeiras", async () => {
  const cookie = await login("joao@email.com");
  const semNome = await request("POST", "/api/produtos", { preco: 10, id_categoria: 1 }, cookie);
  assert.equal(semNome.status, 400);
  assert.equal((await request("POST", "/api/produtos", { nome: "X", id_categoria: 1 }, cookie)).status, 400, "preço obrigatório");
  assert.equal((await request("POST", "/api/produtos", { nome: "X", preco: 1 }, cookie)).status, 400, "categoria obrigatória");
  assert.equal((await request("POST", "/api/produtos", { nome: "X", preco: -1, id_categoria: 1 }, cookie)).status, 400);
  assert.equal((await request("POST", "/api/produtos", { nome: "X", preco: 1, id_categoria: 1, foto: "data:text/html;base64,PGI+" }, cookie)).status, 400, "foto precisa ser imagem");
  assert.equal((await request("POST", "/api/produtos", { nome: "X", preco: 1, id_categoria: 1, imagem_url: "javascript:alert(1)" }, cookie)).status, 400);
  const fk = await request("POST", "/api/produtos", { nome: "X", preco: 1, id_categoria: 999 }, cookie);
  assert.equal(fk.status, 400, "FOREIGN KEY: categoria inexistente");
  assert.equal((await request("PATCH", "/api/produtos/1", {}, cookie)).status, 400);
  assert.equal((await request("PUT", "/api/produtos/999", { nome: "X", preco: 1, id_categoria: 1 }, cookie)).status, 404);
  assert.equal((await request("DELETE", "/api/produtos/999", null, cookie)).status, 404);
  const res = await fetch(`${baseUrl}/api/produtos`, { method: "POST", headers: { "Content-Type": "application/json", Cookie: cookie }, body: "{ruim" });
  assert.equal(res.status, 400);
});

test("Leitura pública: /api/produtos, busca, categorias e fornecedores", async () => {
  const produto = (await request("GET", "/api/produtos/4")).body;
  assert.equal(produto.categoria, "Esportivo");
  assert.equal(produto.fornecedor, "José Silva");
  assert.equal(produto.tamanho, "39");
  const vintage = db.prepare("SELECT COUNT(*) AS n FROM produto WHERE id_categoria = 2").get().n;
  assert.equal((await request("GET", "/api/produtos?q=vintage")).body.length, vintage, "busca pela categoria");
  assert.equal((await request("GET", "/api/produtos?q=josé")).body.length >= 2, true, "busca pelo anunciante");
  assert.equal((await request("GET", "/api/produtos/999")).status, 404);
  assert.equal((await request("GET", "/api/produtos/abc")).status, 400);

  const categorias = await request("GET", "/api/categorias");
  assert.equal(categorias.status, 200);
  assert.ok(categorias.body.find((c) => c.nome === "Feminino").total_produtos >= 1);
  const fornecedores = await request("GET", "/api/fornecedores");
  assert.equal(fornecedores.status, 200);
  assert.ok(fornecedores.body.every((f) => f.email === undefined && f.telefone === undefined), "sem dados pessoais");
  assert.equal((await request("GET", "/api/fornecedores/1")).body.produtos.length >= 3, true);
  // As rotas antigas foram substituídas pelo novo modelo
  assert.equal((await request("GET", "/api/marcas")).status, 404);
  assert.equal((await request("GET", "/api/usuarios")).status, 404);
});

test("Categorias (logado) e FK que impede apagar categoria com produtos", async () => {
  const cookie = await login("ze@email.com");
  const cat = await request("POST", "/api/categorias", { nome: "Acessórios", descricao: "Bolsas e cintos" }, cookie);
  assert.equal(cat.status, 201);
  const idCat = cat.body.categoria.id_categoria;
  assert.equal((await request("PUT", `/api/categorias/${idCat}`, { nome: "Acessórios Femininos" }, cookie)).body.categoria.nome, "Acessórios Femininos");
  assert.equal((await request("DELETE", `/api/categorias/${idCat}`, null, cookie)).status, 200);
  assert.equal((await request("POST", "/api/categorias", {}, cookie)).status, 400);
  assert.equal((await request("DELETE", "/api/categorias/1", null, cookie)).status, 409, "categoria 1 ainda tem produtos");
});

test("Banco: PRAGMA foreign_keys, PKs, FKs e integridade do DER", async () => {
  assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
  const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((t) => t.name).sort();
  assert.deepEqual(tabelas, ["categoria", "cliente", "cupom_desconto", "endereco", "entrega", "fornecedor", "item_pedido", "pagamento", "pedido", "produto"]);

  const pk = (tabela) => db.prepare(`PRAGMA table_info(${tabela})`).all().filter((c) => c.pk).map((c) => c.name);
  assert.deepEqual(pk("cliente"), ["id_cliente"]);
  assert.deepEqual(pk("produto"), ["id_produto"]);
  assert.deepEqual(pk("cupom_desconto"), ["codigo"]);
  assert.deepEqual(pk("item_pedido"), ["id_item_pedido"]);

  const fks = (tabela) => db.prepare(`PRAGMA foreign_key_list(${tabela})`).all().map((f) => `${f.from}->${f.table}.${f.to}`).sort();
  assert.deepEqual(fks("produto"), ["id_categoria->categoria.id_categoria", "id_fornecedor->fornecedor.id_fornecedor"]);
  assert.deepEqual(fks("pedido"), ["codigo_cupom->cupom_desconto.codigo", "id_cliente->cliente.id_cliente"]);
  assert.deepEqual(fks("item_pedido"), ["id_pedido->pedido.id_pedido", "id_produto->produto.id_produto"]);
  assert.deepEqual(fks("endereco"), ["id_cliente->cliente.id_cliente"]);
  assert.deepEqual(fks("pagamento"), ["id_pedido->pedido.id_pedido"]);
  assert.deepEqual(fks("entrega"), ["id_pedido->pedido.id_pedido"]);
  assert.deepEqual(fks("fornecedor"), ["id_cliente->cliente.id_cliente"]);
  assert.deepEqual(db.pragma("foreign_key_check"), [], "nenhuma FK quebrada");

  // FK bloqueia valores inexistentes
  assert.throws(() => db.prepare("INSERT INTO pedido (id_cliente) VALUES (999)").run(), /FOREIGN KEY/);
  assert.throws(() => db.prepare("INSERT INTO pedido (id_cliente, codigo_cupom) VALUES (1, 'NAOEXISTE')").run(), /FOREIGN KEY/);
  assert.throws(() => db.prepare("INSERT INTO item_pedido (id_pedido, id_produto, preco_unitario) VALUES (1, 999, 1)").run(), /FOREIGN KEY/);
  // Cupom é opcional
  const semCupom = db.prepare("INSERT INTO pedido (id_cliente) VALUES (1)").run().lastInsertRowid;
  // ENTREGA 1:0..1 -> um segundo registro para o mesmo pedido é recusado (UNIQUE)
  db.prepare("INSERT INTO entrega (id_pedido, endereco_utilizado) VALUES (?, 'Rua A')").run(semCupom);
  assert.throws(() => db.prepare("INSERT INTO entrega (id_pedido, endereco_utilizado) VALUES (?, 'Rua B')").run(semCupom), /UNIQUE/);
  // PEDIDO 1:N PAGAMENTO -> vários pagamentos são aceitos
  db.prepare("INSERT INTO pagamento (id_pedido, forma_pagamento, valor_pago) VALUES (?, 'Pix', 10)").run(semCupom);
  db.prepare("INSERT INTO pagamento (id_pedido, forma_pagamento, valor_pago) VALUES (?, 'Cartão', 5)").run(semCupom);
  // ON DELETE CASCADE: apagar o pedido apaga entrega e pagamentos
  db.prepare("DELETE FROM pedido WHERE id_pedido = ?").run(semCupom);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pagamento WHERE id_pedido = ?").get(semCupom).n, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM entrega WHERE id_pedido = ?").get(semCupom).n, 0);

  // Produto que já está num pedido não pode ser apagado pela API (409)
  const cookie = await login("ze@email.com");
  db.prepare("INSERT INTO item_pedido (id_pedido, id_produto, preco_unitario) VALUES (2, 4, 149.9)").run();
  assert.equal((await request("DELETE", "/api/produtos/4", null, cookie)).status, 409);
  db.prepare("DELETE FROM item_pedido WHERE id_pedido = 2 AND id_produto = 4").run();
});
