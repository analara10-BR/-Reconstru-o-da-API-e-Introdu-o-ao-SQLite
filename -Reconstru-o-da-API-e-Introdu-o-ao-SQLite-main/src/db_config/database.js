import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Pasta src/databases/ (resolvida a partir deste arquivo, funciona de qualquer diretório)
const DATABASES_DIR = path.join(import.meta.dirname, "..", "databases");

const createDatabase = (dbName = "info.db") => {
  fs.mkdirSync(DATABASES_DIR, { recursive: true });

  // Criação ou Carregamento do Banco de Dados
  // SQLite criará o arquivo automaticamente
  const db = new Database(path.join(DATABASES_DIR, dbName));

  // Para ativar a integridade referencial (necessário para definir relacionamentos entre as tabelas)
  db.pragma("foreign_keys = ON");

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      idade INTEGER CHECK (idade >= 0),
      altura REAL,
      ativo INTEGER NOT NULL CHECK (ativo IN (0,1)),
      saldo NUMERIC DEFAULT 0.0,
      criado_em TEXT DEFAULT (datetime('now')),
      ultimo_login INTEGER,
      foto BLOB
    );
    `,
  ).run(); // Use .run() para INSERT, UPDATE, DELETE

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );
    `,
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS marcas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );
    `,
  ).run();

  // Relacionamento 1:N
  // Exemplo: Marca → Produtos
  // Uma marca pode ter vários produtos.
  // SET NULL: Isso mantém o produto, mas remove o vínculo.
  // A coluna "estoque" foi acrescentada porque o arquivo de testes da API (api.http) envia esse campo.
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      disponibilidade INTEGER NOT NULL,
      preco REAL CHECK (preco >= 0),
      estoque INTEGER NOT NULL DEFAULT 1 CHECK (estoque >= 0),
      marca_id INTEGER,
      FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL
    );
    `,
  ).run();

  // Relacionamento 1:1
  // Exemplo: Produto ↔ DetalhesProduto
  // Cada produto tem um conjunto de detalhes.
  // UNIQUE garante que um produto só tenha um detalhe.
  // Um detalhe de produto faz sentido sem o produto? NÃO -> USAR ON DELETE CASCADE
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS detalhes_produto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER UNIQUE,
      tamanho TEXT,
      condicao TEXT,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    );
    `,
  ).run();

  // Campos visuais do catálogo. ALTER TABLE preserva bancos criados em versões anteriores.
  const colunasProduto = db.prepare("PRAGMA table_info(produtos)").all().map((coluna) => coluna.name);
  if (!colunasProduto.includes("imagem_url")) {
    db.exec("ALTER TABLE produtos ADD COLUMN imagem_url TEXT");
  }
  if (!colunasProduto.includes("descricao")) {
    db.exec("ALTER TABLE produtos ADD COLUMN descricao TEXT");
  }

  // Relacionamento N:N
  // Exemplo: Produtos ↔ Categorias
  // Um produto pode ter várias categorias
  // Uma categoria pode ter vários produtos
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS produtos_categorias (
      produto_id INTEGER,
      categoria_id INTEGER,
      PRIMARY KEY (produto_id, categoria_id),
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
    );
    `,
  ).run();

  return db;
};

export { createDatabase };
