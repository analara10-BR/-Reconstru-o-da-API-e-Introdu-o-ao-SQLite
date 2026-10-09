import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.resolve(here, "../databases");
fs.mkdirSync(databaseDir, { recursive: true });

const createDatabase = (dbName = "info.db") => {
  const db = new Database(path.join(databaseDir, dbName));
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      idade INTEGER CHECK (idade >= 0),
      altura REAL,
      ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0,1)),
      saldo NUMERIC DEFAULT 0.0,
      criado_em TEXT DEFAULT (datetime('now')),
      ultimo_login INTEGER,
      foto BLOB
    );

    CREATE TABLE IF NOT EXISTS autores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS livros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      disponibilidade INTEGER NOT NULL DEFAULT 1 CHECK (disponibilidade IN (0,1)),
      ano INTEGER,
      exemplares INTEGER NOT NULL DEFAULT 1 CHECK (exemplares >= 0),
      autor_id INTEGER,
      FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS detalhes_livro (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      livro_id INTEGER UNIQUE NOT NULL,
      isbn TEXT,
      editora TEXT,
      FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS livros_categorias (
      livro_id INTEGER NOT NULL,
      categoria_id INTEGER NOT NULL,
      PRIMARY KEY (livro_id, categoria_id),
      FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE CASCADE,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE
    );
  `);
  return db;
};

export { createDatabase };
