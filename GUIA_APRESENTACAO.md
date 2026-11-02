# Guia de Apresentação — Brechó Raiz (DER + Login + Anúncios)

Este guia explica **exatamente** o que está no código, para ajudar a equipe na apresentação.

---

## 1. Estrutura de pastas

```text
├── public/                 → arquivos enviados direto para o navegador
│   ├── scripts/            → JavaScript das páginas (fetch na API)
│   │   ├── common.js       → funções comuns (formulário de produto, foto, categorias)
│   │   ├── products.js     → catálogo, filtros, busca e cadastro de peça
│   │   ├── product-details.js → detalhes, edição e exclusão
│   │   ├── auth.js         → envio dos formulários de login e cadastro
│   │   └── site.js         → página inicial e botão "Sair"
│   ├── styles/site.css     → identidade visual (não foi alterada)
│   └── uploads/            → fotos enviadas pelos anunciantes
├── src/
│   ├── app.js              → configura Express, EJS, sessão, middlewares e rotas
│   ├── server.js           → liga o servidor (porta do .env ou 3000)
│   ├── db_config/
│   │   ├── database.js     → CREATE TABLE do DER + migração da versão antiga
│   │   └── connection.js   → conexão única com o banco
│   ├── models/             → comandos SQL (SELECT, INSERT, UPDATE, DELETE)
│   ├── controllers/        → regras de negócio e respostas HTTP
│   ├── routes/             → ligação URL → middlewares → controller
│   ├── middlewares/        → login obrigatório, validações, erros, debug
│   ├── utils/senha.js      → hash e verificação da senha (scrypt)
│   ├── utils/foto.js       → salvar a foto enviada
│   ├── views/              → páginas EJS (layout, header, login, cadastro…)
│   └── scripts/            → populate, select, update, delete e consultas.sql
├── tests/                  → testes automáticos (node:test)
├── rest_client/api.http    → requisições prontas para a extensão REST Client
└── .env.example            → modelo das variáveis de ambiente
```

## 2. Arquivos principais

| Arquivo | O que faz |
|---|---|
| `src/db_config/database.js` | Cria as 10 tabelas do DER, ativa `PRAGMA foreign_keys = ON` e migra bancos antigos |
| `src/models/produtos.model.js` | SQL dos produtos (JOIN com categoria e fornecedor) |
| `src/models/clientes.model.js` | SQL dos clientes (busca por e-mail, cadastro) |
| `src/models/fornecedores.model.js` | Cria/acha o fornecedor ligado ao cliente que anuncia |
| `src/controllers/auth.controller.js` | Cadastro, login, logout e `/me` |
| `src/controllers/produtos.controller.js` | CRUD de produtos, com checagem de dono |
| `src/middlewares/auth.middleware.js` | `carregarUsuario` (global) e `exigirLogin` (protege rotas) |
| `src/middlewares/validate.produto.middleware.js` | Valida os campos do anúncio |
| `src/utils/senha.js` | `gerarHashSenha` e `verificarSenha` |
| `src/app.js` | Configuração do `express-session` |

## 3. Funcionalidades

- Catálogo com busca e filtros (categoria, tamanho, condição, preço) — já existia, foi adaptado.
- Detalhes da peça (agora mostra **Anunciante** e **Categoria** no lugar de Marca e Unidades).
- **Cadastro de cliente** (nome, e-mail, telefone, senha) — página `/cadastro`.
- **Login** (`/login`) e **logout** (botão "Sair" no header).
- **Anunciar peça** (só logado): nome, descrição, tamanho, preço, estado, disponibilidade, categoria e foto.
- **Editar/excluir** só as peças que a própria pessoa anunciou.
- Página inicial mostra totais de peças, fornecedores e categorias.

## 4. Trechos principais para explicar

**a) Ativando as chaves estrangeiras** (`database.js`)
```js
db.pragma("foreign_keys = ON");
```
O SQLite vem com as FKs desligadas; sem essa linha ele aceitaria um produto com categoria que não existe.

**b) Tabela produto com duas FKs** (`database.js`)
```sql
FOREIGN KEY (id_categoria)  REFERENCES categoria(id_categoria),
FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
```

**c) Hash da senha** (`utils/senha.js`)
```js
const salt = crypto.randomBytes(16).toString("hex");
const hash = await scrypt(senha, salt, 64);
return `scrypt$${salt}$${hash.toString("hex")}`;
```

**d) Iniciar a sessão no login** (`auth.controller.js`)
```js
req.session.regenerate(() => { req.session.clienteId = idCliente; ... });
```

**e) Protegendo a rota de anúncio** (`produtos.routes.js`)
```js
router.post("/produtos", exigirLogin, validateProduto(true), (req, res, next) => controller.createProduto(req, res, next));
```

**f) Quem anuncia vira fornecedor** (`produtos.controller.js`)
```js
const fornecedor = this.fornecedores.obterOuCriarParaCliente(req.cliente);
this.model.create({ ...dados, id_fornecedor: fornecedor.id_fornecedor });
```

## 5. PK, FK, tabela associativa e relacionamentos

- **PK (chave primária)**: identifica cada linha. Ex.: `id_produto`. Em `cupom_desconto` a PK é o próprio `codigo` (texto).
- **FK (chave estrangeira)**: coluna que guarda a PK de outra tabela. Ex.: `produto.id_categoria`.
- **Tabela associativa**: `item_pedido`. Um pedido tem vários produtos e um produto pode estar em vários pedidos (N:N). O `item_pedido` guarda `id_pedido` + `id_produto` + `quantidade` + `preco_unitario`.

| Relacionamento (DER) | Como foi feito |
|---|---|
| CLIENTE 1:N ENDERECO | `endereco.id_cliente` (ON DELETE CASCADE) |
| CLIENTE 1:N PEDIDO | `pedido.id_cliente` |
| PEDIDO N:N PRODUTO | tabela `item_pedido` (`UNIQUE(id_pedido, id_produto)`) |
| PEDIDO 1:N PAGAMENTO | `pagamento.id_pedido` (CASCADE) |
| PEDIDO 1:0..1 ENTREGA | `entrega.id_pedido` **UNIQUE** (no máximo uma entrega por pedido) |
| CUPOM 1:N PEDIDO (opcional) | `pedido.codigo_cupom` pode ser NULL |
| CATEGORIA 1:N PRODUTO | `produto.id_categoria` NOT NULL |
| FORNECEDOR 1:N PRODUTO | `produto.id_fornecedor` NOT NULL |

**Ações nas FKs**
- `ON DELETE CASCADE`: apagar o pedido apaga itens, pagamentos e entrega.
- Sem `ON DELETE` (NO ACTION): o banco **bloqueia** apagar uma categoria que tem produtos, ou um produto que está em um pedido (a API responde 409).
- `ON DELETE SET NULL` em `fornecedor.id_cliente`: se a conta sumir, o fornecedor e as peças continuam.

**Colunas que não estão no DER e por quê**
- `cliente.senha_hash`: sem senha não há login. Guardamos só o hash.
- `produto.imagem_url`: caminho/link da foto do anúncio.
- `fornecedor.id_cliente`: liga o fornecedor (quem fornece a peça) à conta de quem anunciou. Assim usamos o relacionamento FORNECE do DER em vez de inventar outro.

**O que saiu em relação à versão antiga**
- `marcas` e `estoque` não existem no DER, então saíram do site. No DER cada produto tem **uma** categoria (antes eram várias: N:N).
- `detalhes_produto` (1:1) foi absorvida pela tabela `produto` (`tamanho`, `estado_conservacao`).
- Nada foi apagado: em bancos antigos as tabelas viram `legado_usuarios`, `legado_produtos`, `legado_marcas` etc.

## 6. SQLite

- Banco em um único arquivo: `src/databases/info.db` (testes usam outros arquivos).
- Biblioteca `better-sqlite3`: comandos síncronos, `prepare(sql)` + `.run()` / `.get()` / `.all()`.
- Parâmetros `?` evitam **SQL Injection** (o valor vai separado do SQL).
- `CHECK` (ex.: `preco >= 0`) e `UNIQUE` (ex.: `cliente.email`) são regras garantidas pelo próprio banco.

**Migração (versão antiga → DER)**: quando o servidor abre um banco que ainda tem a tabela `produtos`, ele (1) copia o arquivo para `info.db.backup-DATA`, (2) copia os dados para as tabelas novas com os mesmos ids, (3) renomeia as antigas para `legado_*`. Tudo dentro de uma **transação**: se der erro, nada muda. Produtos com várias categorias ficam com a de menor id; produtos sem categoria vão para "Outros"; todos ficam com o fornecedor "Acervo Brechó Raiz"; usuários antigos viram clientes **sem senha** (precisam se cadastrar de novo com outro e-mail ou ter senha definida).

## 7. Fluxos

**Cadastro**: formulário `/cadastro` → `auth.js` faz `POST /api/auth/cadastro` → controller valida (nome, e-mail, telefone, senha ≥ 6, senhas iguais) → confere e-mail duplicado (409) → gera hash → `INSERT INTO cliente` → abre a sessão → volta para o catálogo.

**Login**: `/login` → `POST /api/auth/login` → `SELECT * FROM cliente WHERE email = ?` → `verificarSenha` recalcula o hash com o mesmo salt e compara com `timingSafeEqual` → se ok, `req.session.regenerate` e guarda `clienteId`. Se errar, a mensagem é sempre "E-mail ou senha incorretos." (não revela quais e-mails existem).

**Autenticação em cada requisição**: o navegador envia o cookie `brecho.sid` (só o id da sessão, `httpOnly`, `sameSite: lax`, expira em 2h) → `carregarUsuario` busca o cliente → `req.cliente` e `res.locals.usuario` (o header mostra "Olá, Nome" e "Sair").

**Logout**: botão "Sair" → `POST /api/auth/logout` → `req.session.destroy()` + `clearCookie`.

**Anúncio**: botão "Cadastrar produto" → sem login aparece o aviso com "Entrar" e "Criar conta"; logado aparece o formulário → `common.js` lê os campos e converte a foto para base64 → `POST /api/produtos` → `exigirLogin` → `validateProduto` → controller cria/acha o fornecedor do cliente → salva a foto em `public/uploads` → `INSERT INTO produto` → o catálogo recarrega e a peça aparece.

## 8. Rotas, controllers e middlewares

| Método e rota | Proteção | Controller |
|---|---|---|
| `POST /api/auth/cadastro` | — | `AuthController.cadastrar` |
| `POST /api/auth/login` | — | `AuthController.login` |
| `POST /api/auth/logout` | — | `AuthController.logout` |
| `GET /api/auth/me` | — | `AuthController.me` |
| `GET /api/products`, `/api/products/:id` | — | `ProductsController` (formato do catálogo) |
| `GET /api/produtos`, `/api/produtos/:produtoId` | — | `ProdutosController` |
| `POST /api/produtos` | `exigirLogin` | `ProdutosController.createProduto` |
| `PUT/PATCH/DELETE /api/produtos/:produtoId` | `exigirLogin` + dono | `ProdutosController` |
| `GET /api/categorias`, `/api/categorias/:id` | — | `CategoriasController` |
| `POST/PUT/DELETE /api/categorias…` | `exigirLogin` | `CategoriasController` |
| `GET /api/fornecedores`, `/api/fornecedores/:id` | — | `FornecedoresController` |
| `GET /home /about /contact /products /products/:id /login /cadastro` | — | `views.routes.js` |

Middlewares: `mcors` (CORS), `express.json` (limite 4 MB por causa da foto), `mdebug` (log, **esconde a senha**), `express-session`, `carregarUsuario`, `exigirLogin`, `verifyParamId`, `validateProduto`, `notFound` (404) e `errorHandler` (400/413/500).

Respostas de erro: 400 dados inválidos · 401 não logado / login errado · 403 peça de outra pessoa · 404 não encontrado · 409 e-mail duplicado ou registro em uso.

## 9. Perguntas prováveis

- **Por que não guardar a senha?** Se o banco vazar, ninguém descobre as senhas. O hash não tem volta.
- **O que é o salt?** Um valor aleatório por usuário; duas pessoas com a mesma senha têm hashes diferentes.
- **Por que scrypt e não SHA-256?** scrypt é feito para senhas: é lento e usa memória, dificultando força bruta. Vem no Node (`crypto`).
- **Onde fica a sessão?** No servidor (memória do `express-session`). O navegador só tem o id no cookie. Por isso, ao reiniciar o servidor, é preciso logar de novo.
- **Como uma pessoa não edita a peça da outra?** O controller compara `fornecedor.id_cliente` do produto com o cliente logado e responde 403.
- **Por que FORNECEDOR e não um campo `id_cliente` no produto?** O DER já tem FORNECEDOR 1:N PRODUTO; quem anuncia uma peça é quem a fornece. Só ligamos o fornecedor à conta.
- **Como é garantido o 0..1 da entrega?** `UNIQUE` em `entrega.id_pedido`.
- **E o cupom opcional?** `pedido.codigo_cupom` aceita NULL; se preenchido, a FK exige que o cupom exista.
- **O que acontece se apagar uma categoria com produtos?** A FK bloqueia; a API responde 409.
- **Os dados antigos foram perdidos?** Não: backup do arquivo + tabelas `legado_*`.
- **Pedidos/pagamentos têm tela?** Ainda não; as tabelas existem com dados de exemplo e são usadas nos scripts SQL (`db:select`, `consultas.sql`).

## 10. Comandos SQL úteis

```sql
PRAGMA foreign_keys;                 -- 1 = ligado
PRAGMA foreign_key_list(produto);    -- FKs da tabela
PRAGMA foreign_key_check;            -- vazio = nenhuma FK quebrada

SELECT p.nome, c.nome AS categoria, f.nome AS fornecedor
FROM produto p
INNER JOIN categoria c  ON c.id_categoria  = p.id_categoria
INNER JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor;

SELECT pe.id_pedido, cl.nome, pr.nome AS produto, i.quantidade
FROM pedido pe
JOIN cliente cl    ON cl.id_cliente = pe.id_cliente
JOIN item_pedido i ON i.id_pedido   = pe.id_pedido
JOIN produto pr    ON pr.id_produto = i.id_produto;

-- Deve falhar (FOREIGN KEY constraint failed):
INSERT INTO produto (nome, preco, id_categoria, id_fornecedor) VALUES ('Teste', 10, 999, 1);
```
Mais exemplos em `src/scripts/consultas.sql`.

## 11. Executar e testar

```bash
npm install
cp .env.example .env        # troque SESSION_SECRET
npm run db:populate         # clientes de exemplo: ze@email.com e joao@email.com, senha brecho123
npm run dev                 # http://localhost:3000/home
npm test                    # 16 testes (API, autenticação, banco e migração)
```

Os testes (`tests/api.test.js`, `tests/migracao.test.js`) cobrem: cadastro, obrigatórios, e-mail duplicado, hash, login válido/inválido, logout, bloqueio sem login, anúncio logado salvo no SQLite e exibido no catálogo, dono x outra pessoa, PKs, FKs, CASCADE, UNIQUE da entrega, migração sem perda de dados e as páginas existentes.

Para demonstrar: abra `/products` sem login → "Cadastrar produto" mostra o aviso → "Criar conta" → anuncie uma peça com foto → ela aparece no catálogo → abra a peça (formulário de edição aparece só para você) → "Sair".
