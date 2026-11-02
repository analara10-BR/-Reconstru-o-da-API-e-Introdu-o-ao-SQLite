import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Pasta src/databases/ (resolvida a partir deste arquivo, funciona de qualquer diretório)
const DATABASES_DIR = path.join(import.meta.dirname, "..", "databases");

/*
  ESTRUTURA DO BANCO (de acordo com o DER "Feedback do DER - Equipe 05")

  PK (Primary Key / chave primária): identifica cada linha da tabela de forma única.
  FK (Foreign Key / chave estrangeira): coluna que guarda a PK de outra tabela e cria o relacionamento.

  Relacionamentos do DER:
  - CLIENTE    1 : N  ENDERECO      (endereco.id_cliente)
  - CLIENTE    1 : N  PEDIDO        (pedido.id_cliente)
  - PEDIDO     1 : N  ITEM_PEDIDO   (item_pedido.id_pedido)
  - PRODUTO    1 : N  ITEM_PEDIDO   (item_pedido.id_produto)
      -> ITEM_PEDIDO é a tabela associativa que resolve o N:N entre PEDIDO e PRODUTO
  - PEDIDO     1 : N  PAGAMENTO     (pagamento.id_pedido)
  - PEDIDO     1 : 0..1 ENTREGA     (entrega.id_pedido com UNIQUE)
  - CUPOM      1 : N  PEDIDO        (pedido.codigo_cupom, opcional -> pode ser NULL)
  - CATEGORIA  1 : N  PRODUTO       (produto.id_categoria)
  - FORNECEDOR 1 : N  PRODUTO       (produto.id_fornecedor)

  Colunas que NÃO estão no DER, mas foram necessárias (explicadas no GUIA_APRESENTACAO.md):
  - cliente.senha_hash     -> sem a senha não existe login (guardamos só o hash, nunca a senha)
  - produto.imagem_url     -> guarda o link/caminho da foto do produto
  - fornecedor.id_cliente  -> liga o fornecedor (quem anuncia a peça) à conta do cliente logado
*/
const criarTabelas = (db) => {
  db.exec(`
    -- CLIENTE: pessoas cadastradas no site (também são quem anuncia as peças)
    -- UNIQUE no email impede duas contas com o mesmo e-mail
    CREATE TABLE IF NOT EXISTS cliente (
      id_cliente INTEGER PRIMARY KEY AUTOINCREMENT,
      nome       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
      telefone   TEXT,
      senha_hash TEXT
    );

    -- ENDERECO: um cliente pode ter vários endereços (1:N)
    -- ON DELETE CASCADE: se o cliente for apagado, os endereços dele também são
    CREATE TABLE IF NOT EXISTS endereco (
      id_endereco INTEGER PRIMARY KEY AUTOINCREMENT,
      id_cliente  INTEGER NOT NULL,
      logradouro  TEXT NOT NULL,
      numero      TEXT,
      bairro      TEXT,
      cidade      TEXT NOT NULL,
      cep         TEXT,
      FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE CASCADE
    );

    -- CATEGORIA: cada produto pertence a UMA categoria (1:N)
    CREATE TABLE IF NOT EXISTS categoria (
      id_categoria INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT NOT NULL,
      descricao    TEXT
    );

    -- FORNECEDOR: quem fornece as peças. Uma pessoa que anuncia no site vira fornecedora.
    -- id_cliente é opcional (o acervo da própria loja não tem conta de cliente)
    -- UNIQUE: cada cliente tem no máximo um registro de fornecedor
    -- ON DELETE SET NULL: se a conta for apagada, o fornecedor continua (com as peças), só perde o vínculo
    CREATE TABLE IF NOT EXISTS fornecedor (
      id_fornecedor INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT NOT NULL,
      contato       TEXT,
      telefone      TEXT,
      email         TEXT,
      id_cliente    INTEGER UNIQUE,
      FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE SET NULL
    );

    -- PRODUTO: as peças do brechó
    -- id_categoria e id_fornecedor são NOT NULL porque no DER o lado da categoria/fornecedor é "1"
    -- Sem ON DELETE: o SQLite usa NO ACTION e BLOQUEIA apagar uma categoria/fornecedor que ainda tem produtos
    -- CHECK: regras simples que o próprio banco garante (preço não negativo, disponibilidade 0 ou 1)
    CREATE TABLE IF NOT EXISTS produto (
      id_produto         INTEGER PRIMARY KEY AUTOINCREMENT,
      nome               TEXT NOT NULL,
      descricao          TEXT,
      tamanho            TEXT,
      preco              REAL CHECK (preco IS NULL OR preco >= 0),
      estado_conservacao TEXT,
      disponibilidade    INTEGER NOT NULL DEFAULT 1 CHECK (disponibilidade IN (0, 1)),
      imagem_url         TEXT,
      id_categoria       INTEGER NOT NULL,
      id_fornecedor      INTEGER NOT NULL,
      FOREIGN KEY (id_categoria)  REFERENCES categoria(id_categoria),
      FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
    );

    -- CUPOM_DESCONTO: a PK é o próprio código do cupom (texto), como no DER
    CREATE TABLE IF NOT EXISTS cupom_desconto (
      codigo   TEXT PRIMARY KEY,
      validade TEXT NOT NULL,
      valor    REAL NOT NULL CHECK (valor > 0)
    );

    -- PEDIDO: um cliente faz vários pedidos (1:N)
    -- codigo_cupom é OPCIONAL (pode ser NULL), mas se for preenchido precisa existir em cupom_desconto
    CREATE TABLE IF NOT EXISTS pedido (
      id_pedido    INTEGER PRIMARY KEY AUTOINCREMENT,
      data_pedido  TEXT NOT NULL DEFAULT (datetime('now')),
      status       TEXT NOT NULL DEFAULT 'pendente'
                   CHECK (status IN ('pendente', 'pago', 'enviado', 'entregue', 'cancelado')),
      valor_total  REAL NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
      id_cliente   INTEGER NOT NULL,
      codigo_cupom TEXT,
      FOREIGN KEY (id_cliente)   REFERENCES cliente(id_cliente),
      FOREIGN KEY (codigo_cupom) REFERENCES cupom_desconto(codigo) ON UPDATE CASCADE
    );

    -- ITEM_PEDIDO: tabela associativa entre PEDIDO e PRODUTO (N:N)
    -- Guarda o preço do momento da compra (preco_unitario) e a quantidade
    -- UNIQUE (id_pedido, id_produto): o mesmo produto não aparece duas vezes no mesmo pedido
    CREATE TABLE IF NOT EXISTS item_pedido (
      id_item_pedido INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pedido      INTEGER NOT NULL,
      id_produto     INTEGER NOT NULL,
      preco_unitario REAL NOT NULL CHECK (preco_unitario >= 0),
      quantidade     INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
      UNIQUE (id_pedido, id_produto),
      FOREIGN KEY (id_pedido)  REFERENCES pedido(id_pedido) ON DELETE CASCADE,
      FOREIGN KEY (id_produto) REFERENCES produto(id_produto)
    );

    -- PAGAMENTO: um pedido pode ter vários pagamentos (1:N)
    CREATE TABLE IF NOT EXISTS pagamento (
      id_pagamento     INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pedido        INTEGER NOT NULL,
      data_pagamento   TEXT NOT NULL DEFAULT (datetime('now')),
      forma_pagamento  TEXT NOT NULL,
      valor_pago       REAL NOT NULL CHECK (valor_pago >= 0),
      status_pagamento TEXT NOT NULL DEFAULT 'pendente',
      FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE
    );

    -- ENTREGA: cada pedido tem no máximo UMA entrega (0..1)
    -- O UNIQUE em id_pedido é o que transforma o 1:N em 1:0..1
    CREATE TABLE IF NOT EXISTS entrega (
      id_entrega         INTEGER PRIMARY KEY AUTOINCREMENT,
      id_pedido          INTEGER NOT NULL UNIQUE,
      endereco_utilizado TEXT NOT NULL,
      situacao           TEXT NOT NULL DEFAULT 'aguardando envio',
      rastreamento       TEXT,
      FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE
    );

    -- Índices nas FKs deixam os JOINs mais rápidos
    CREATE INDEX IF NOT EXISTS idx_produto_categoria  ON produto(id_categoria);
    CREATE INDEX IF NOT EXISTS idx_produto_fornecedor ON produto(id_fornecedor);
    CREATE INDEX IF NOT EXISTS idx_pedido_cliente     ON pedido(id_cliente);
    CREATE INDEX IF NOT EXISTS idx_endereco_cliente   ON endereco(id_cliente);
    CREATE INDEX IF NOT EXISTS idx_item_produto       ON item_pedido(id_produto);
  `);
};

const tabelaExiste = (db, nome) =>
  Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(nome));

const colunasDe = (db, tabela) => db.prepare(`PRAGMA table_info(${tabela})`).all().map((c) => c.name);

// Tabelas da versão anterior do projeto (antes do novo DER)
const TABELAS_ANTIGAS = ["usuarios", "categorias", "marcas", "produtos", "detalhes_produto", "produtos_categorias"];

/*
  MIGRAÇÃO SEGURA (versão antiga -> novo DER)
  Roda só uma vez, quando o banco ainda tem a tabela antiga "produtos".
  1. Faz uma cópia de segurança do arquivo .db
  2. Copia os dados antigos para as tabelas novas (mantendo os mesmos ids)
  3. Renomeia as tabelas antigas para legado_* (nada é apagado)
  Tudo dentro de uma transação: se der qualquer erro, nada é alterado.
*/
const migrarVersaoAntiga = (db, arquivo) => {
  if (!tabelaExiste(db, "produtos")) return;

  if (arquivo && fs.existsSync(arquivo)) {
    const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
    fs.copyFileSync(arquivo, `${arquivo}.backup-${carimbo}`);
  }

  const migrar = db.transaction(() => {
    // usuarios -> cliente (eles não tinham senha, então senha_hash fica NULL e não conseguem logar)
    if (tabelaExiste(db, "usuarios")) {
      db.exec(`
        INSERT OR IGNORE INTO cliente (id_cliente, nome, email)
        SELECT id, nome, lower(email) FROM usuarios;
      `);
    }

    // categorias -> categoria
    if (tabelaExiste(db, "categorias")) {
      db.exec(`
        INSERT OR IGNORE INTO categoria (id_categoria, nome)
        SELECT id, nome FROM categorias;
      `);
    }

    const totalProdutos = db.prepare("SELECT COUNT(*) AS n FROM produtos").get().n;
    if (totalProdutos > 0) {
      // No DER todo produto tem um fornecedor. As peças antigas são do acervo da própria equipe.
      const idAcervo = Number(
        db
          .prepare("INSERT INTO fornecedor (nome, contato) VALUES (?, ?)")
          .run("Acervo Brechó Raiz", "Equipe do projeto").lastInsertRowid,
      );

      // No DER todo produto tem UMA categoria. Peças antigas sem categoria vão para "Outros".
      const semCategoria = db
        .prepare(
          `SELECT COUNT(*) AS n FROM produtos p
           WHERE NOT EXISTS (SELECT 1 FROM produtos_categorias pc WHERE pc.produto_id = p.id)`,
        )
        .get().n;
      let idOutros = null;
      if (semCategoria > 0) {
        idOutros = Number(
          db
            .prepare("INSERT INTO categoria (nome, descricao) VALUES (?, ?)")
            .run("Outros", "Peças sem categoria definida").lastInsertRowid,
        );
      }

      // Colunas que podem não existir em bancos muito antigos
      const cols = colunasDe(db, "produtos");
      const imagem = cols.includes("imagem_url") ? "p.imagem_url" : "NULL";
      const descricao = cols.includes("descricao") ? "p.descricao" : "NULL";
      const temDetalhes = tabelaExiste(db, "detalhes_produto");

      // Produtos antigos com várias categorias ficam com a primeira (menor id).
      // As outras continuam guardadas em legado_produtos_categorias.
      db.prepare(
        `
        INSERT INTO produto (id_produto, nome, descricao, tamanho, preco, estado_conservacao,
                             disponibilidade, imagem_url, id_categoria, id_fornecedor)
        SELECT p.id, p.nome, ${descricao},
               ${temDetalhes ? "d.tamanho" : "NULL"}, p.preco, ${temDetalhes ? "d.condicao" : "NULL"},
               CASE WHEN p.disponibilidade = 1 THEN 1 ELSE 0 END, ${imagem},
               COALESCE((SELECT MIN(pc.categoria_id) FROM produtos_categorias pc WHERE pc.produto_id = p.id), ?),
               ?
        FROM produtos p
        ${temDetalhes ? "LEFT JOIN detalhes_produto d ON d.produto_id = p.id" : ""}
        `,
      ).run(idOutros, idAcervo);
    }

    // Renomeia as tabelas antigas (o SQLite atualiza as FKs entre elas automaticamente)
    for (const tabela of TABELAS_ANTIGAS) {
      if (tabelaExiste(db, tabela) && !tabelaExiste(db, `legado_${tabela}`)) {
        db.exec(`ALTER TABLE ${tabela} RENAME TO legado_${tabela}`);
      }
    }
  });

  migrar();

  // Confere se nenhuma FK ficou apontando para um registro inexistente
  const problemas = db.pragma("foreign_key_check");
  if (problemas.length > 0) {
    console.warn("Atenção: a verificação de chaves estrangeiras encontrou problemas:", problemas);
  }
};

// Adiciona categorias iniciais somente quando a tabela estiver vazia.
// Categorias já cadastradas nunca são apagadas nem duplicadas.
const garantirCategoriasPadrao = (db) => {
  const total = db.prepare("SELECT COUNT(*) AS total FROM categoria").get().total;
  if (total > 0) return;

  const inserir = db.prepare("INSERT INTO categoria (nome, descricao) VALUES (?, ?)");
  const categoriasPadrao = [
    ["Roupas", "Camisas, calças, saias e outras peças de vestuário"],
    ["Vestidos", "Vestidos de diferentes modelos"],
    ["Calçados", "Tênis, sapatos, sandálias e botas"],
    ["Bolsas", "Bolsas e mochilas"],
    ["Acessórios", "Cintos, bijuterias e outros acessórios"],
    ["Outros", "Peças que não se encaixam nas demais categorias"],
  ];

  const inserirTodas = db.transaction(() => {
    for (const [nome, descricao] of categoriasPadrao) inserir.run(nome, descricao);
  });
  inserirTodas();
};

const createDatabase = (dbName = "info.db") => {
  fs.mkdirSync(DATABASES_DIR, { recursive: true });

  // Criação ou carregamento do banco de dados (o SQLite cria o arquivo automaticamente)
  const arquivo = path.join(DATABASES_DIR, dbName);
  const db = new Database(arquivo);

  // O SQLite vem com as FKs DESLIGADAS por padrão.
  // Este PRAGMA ativa a integridade referencial em toda conexão.
  db.pragma("foreign_keys = ON");

  criarTabelas(db);
  migrarVersaoAntiga(db, arquivo);
  garantirCategoriasPadrao(db);

  return db;
};

export { createDatabase, DATABASES_DIR };
