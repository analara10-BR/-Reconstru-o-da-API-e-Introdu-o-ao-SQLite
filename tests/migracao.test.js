// Testa a migração do banco antigo (usuarios, produtos, marcas...) para o novo DER.
// Cria um banco no formato antigo, roda createDatabase() e confere se nenhum dado foi perdido.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createDatabase, DATABASES_DIR } from "../src/db_config/database.js";

const NOME = "migracao_teste.db";
const arquivo = path.join(DATABASES_DIR, NOME);
const limpar = () => {
  for (const f of fs.readdirSync(DATABASES_DIR)) if (f.startsWith(NOME)) fs.rmSync(path.join(DATABASES_DIR, f), { force: true });
};

after(limpar);

test("Migração: dados antigos copiados para o DER, backup criado e tabelas legado_* preservadas", () => {
  limpar();
  fs.mkdirSync(DATABASES_DIR, { recursive: true });
  const antigo = new Database(arquivo);
  antigo.pragma("foreign_keys = ON");
  antigo.exec(`
    CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, ativo INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE categorias (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL);
    CREATE TABLE marcas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL);
    CREATE TABLE produtos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, disponibilidade INTEGER NOT NULL, preco REAL,
      estoque INTEGER NOT NULL DEFAULT 1, marca_id INTEGER, imagem_url TEXT, descricao TEXT,
      FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL);
    CREATE TABLE detalhes_produto (id INTEGER PRIMARY KEY AUTOINCREMENT, produto_id INTEGER UNIQUE, tamanho TEXT, condicao TEXT,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE);
    CREATE TABLE produtos_categorias (produto_id INTEGER, categoria_id INTEGER, PRIMARY KEY (produto_id, categoria_id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE, FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE);
    INSERT INTO usuarios (nome, email) VALUES ('José', 'ze@email.com');
    INSERT INTO categorias (nome) VALUES ('Feminino'), ('Vintage');
    INSERT INTO marcas (nome) VALUES ('Zara');
    INSERT INTO produtos (nome, disponibilidade, preco, marca_id, descricao) VALUES ('Vestido', 1, 59.9, 1, 'Floral'), ('Moletom', 0, 69.9, NULL, NULL);
    INSERT INTO detalhes_produto (produto_id, tamanho, condicao) VALUES (1, 'M', 'Seminovo');
    INSERT INTO produtos_categorias VALUES (1, 2), (1, 1);
  `);
  antigo.close();

  const db = createDatabase(NOME);
  try {
    assert.equal(db.pragma("foreign_keys", { simple: true }), 1);
    assert.ok(fs.readdirSync(DATABASES_DIR).some((f) => f.startsWith(`${NOME}.backup-`)), "backup do arquivo criado");

    const vestido = db.prepare("SELECT * FROM produto WHERE id_produto = 1").get();
    assert.equal(vestido.nome, "Vestido");
    assert.equal(vestido.preco, 59.9);
    assert.equal(vestido.tamanho, "M");
    assert.equal(vestido.estado_conservacao, "Seminovo");
    assert.equal(vestido.descricao, "Floral");
    assert.equal(vestido.id_categoria, 1, "primeira categoria (menor id)");
    const moletom = db.prepare("SELECT p.*, c.nome AS categoria FROM produto p JOIN categoria c USING (id_categoria) WHERE id_produto = 2").get();
    assert.equal(moletom.disponibilidade, 0);
    assert.equal(moletom.categoria, "Outros", "produto sem categoria vai para 'Outros'");
    assert.equal(db.prepare("SELECT nome FROM fornecedor WHERE id_fornecedor = ?").get(vestido.id_fornecedor).nome, "Acervo Brechó Raiz");

    const cliente = db.prepare("SELECT * FROM cliente WHERE id_cliente = 1").get();
    assert.equal(cliente.email, "ze@email.com");
    assert.equal(cliente.senha_hash, null, "usuário antigo não tinha senha");

    // Nada foi apagado: as tabelas antigas continuam com outro nome
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM legado_produtos").get().n, 2);
    assert.equal(db.prepare("SELECT nome FROM legado_marcas").get().nome, "Zara");
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM legado_produtos_categorias").get().n, 2);
    assert.deepEqual(db.pragma("foreign_key_check"), []);
  } finally {
    db.close();
  }

  // Abrir de novo não migra outra vez (idempotente)
  const db2 = createDatabase(NOME);
  try {
    assert.equal(db2.prepare("SELECT COUNT(*) AS n FROM produto").get().n, 2);
    assert.equal(db2.prepare("SELECT COUNT(*) AS n FROM fornecedor").get().n, 1);
  } finally {
    db2.close();
  }
});
