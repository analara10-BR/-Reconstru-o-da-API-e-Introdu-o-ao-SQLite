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
    CREATE TABLE IF NOT EXISTS autores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );
    `,
  ).run();

  // Relacionamento 1:N
  // Exemplo: Autor → Livros
  // Um autor pode ter vários livros.
  // SET NULL: Isso mantém o livro, mas remove o vínculo.
  // A coluna "exemplares" foi acrescentada porque o arquivo de testes da API (api.http) envia esse campo.
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS livros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      disponibilidade INTEGER NOT NULL,
      ano INTEGER,
      exemplares INTEGER NOT NULL DEFAULT 1 CHECK (exemplares >= 0),
      autor_id INTEGER,
      FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE SET NULL
    );
    `,
  ).run();

  // Relacionamento 1:1
  // Exemplo: Livro ↔ DetalhesLivro
  // Cada livro tem um conjunto de detalhes.
  // UNIQUE garante que um livro só tenha um detalhe.
  // Um detalhe de livro faz sentido sem o livro? NÃO -> USAR ON DELETE CASCADE
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS detalhes_livro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      livro_id INTEGER UNIQUE,
      isbn TEXT,
      editora TEXT,
      FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE
    );
    `,
  ).run();

  // Relacionamento N:N
  // Exemplo: Livros ↔ Categorias
  // Um livro pode ter várias categorias
  // Uma categoria pode ter vários livros
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS livros_categorias (
      livro_id INTEGER,
      categoria_id INTEGER,
      PRIMARY KEY (livro_id, categoria_id),
      FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
    );
    `,
  ).run();

  return db;
};

export { createDatabase };
