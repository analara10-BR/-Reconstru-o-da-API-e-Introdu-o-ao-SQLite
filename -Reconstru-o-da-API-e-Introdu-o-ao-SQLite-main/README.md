# Atividade 01 — Reconstrução da API e Introdução ao SQLite

**Brechó Raiz** — catálogo de moda circular com API REST em Node.js + Express, páginas EJS + Bootstrap 5 e banco de dados SQLite (`better-sqlite3`).

**Alunas:** Leticia Ribeiro da Silva · Ana Lara Martins Inocencio · Nayelle Lima de Sousa

> Tema: brechó online (roupas e acessórios de segunda mão). O material de SQLite usa livros/autores como exemplo;
> aqui a mesma estrutura foi adaptada para **produtos** (peças), **marcas** (1:N), **detalhes_produto** (1:1: tamanho e
> estado de conservação) e **categorias** (N:N). As páginas `/products` e a rota `/api/products` mostram os produtos no
> formato `productsList` pedido na Atividade N2.

---

## 1. Requisitos para executar

- [Node.js](https://nodejs.org/) 20.11 ou superior (recomendado: versão LTS) — confira com `node -v`
- [VS Code](https://code.visualstudio.com/) com as extensões:
  - **REST Client** (Huachao Mao) — para executar `rest_client/api.http`
  - **SQLite Viewer** (Florian Klampfer) — para abrir `src/databases/info.db`
  - **EJS language support** (opcional)

## 2. Como executar no VS Code

1. Abra a pasta do projeto no VS Code (`File > Open Folder...`).
2. Abra o terminal integrado (`Ctrl + '`) e instale as dependências:
   ```bash
   npm install
   ```
3. (Opcional) Copie `.env.example` para `.env` para mudar a porta ou o nome do banco.
4. Crie o banco e insira os dados de exemplo:
   ```bash
   npm run db:populate
   ```
> **Atenção:** `npm run db:populate` apaga os dados atuais e insere dados de demonstração. Não execute esse comando em um banco com produtos reais sem antes fazer uma cópia de segurança. As novas colunas visuais são adicionadas automaticamente quando o servidor abre o banco.

5. Inicie o servidor:
   ```bash
   npm run dev     # com nodemon (reinicia ao salvar)
   # ou
   npm start
   ```
6. Acesse no navegador: <http://localhost:3000/home>

Para parar o servidor: `Ctrl + C` no terminal.

## 3. Experiência visual e catálogo

- Interface responsiva com identidade visual em tons de creme, areia e verde-oliva.
- Página inicial com apresentação do brechó, atalhos de categorias, contadores do banco e peças em destaque.
- Catálogo com busca por nome, marca, descrição, tamanho e categoria, além de filtros por categoria, tamanho, condição e faixa de preço.
- Cadastro e edição de produto incluem descrição e link da imagem; esses dados são gravados no SQLite.
- Quando um produto não tem imagem cadastrada, o site mostra uma foto ilustrativa por tipo de peça. Para usar uma foto própria, informe o link direto da imagem no cadastro/edição.
- A criação do banco adiciona as colunas `imagem_url` e `descricao` de forma compatível com bancos antigos, sem apagar os registros existentes.

## 4. Como conferir os resultados

| O que conferir | Como |
| --- | --- |
| Testes automáticos (9 grupos de testes da API e do banco) | `npm test` |
| Rotas da API | Abra `rest_client/api.http` e clique em **Send Request** acima de cada requisição |
| Páginas | <http://localhost:3000/home>, `/about`, `/contact`, `/products`, `/products/1` |
| CRUD pela interface | Em `/products`: **+ Cadastrar produto** (POST) e busca. Em **Ver detalhes**: **Salvar alterações** (PATCH) e **Excluir produto** (DELETE) |
| Banco de dados | Abra `src/databases/info.db` com o SQLite Viewer |
| Comandos SQL do material | `npm run db:select`, `npm run db:update`, `npm run db:delete` (depois rode `npm run db:populate` para restaurar os dados) |
| Consultas SQL puras | `src/scripts/consultas.sql` |

## 5. Scripts (`package.json`)

| Script | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor (`node src/server.js`) |
| `npm run dev` | Inicia com `nodemon` |
| `npm run db:populate` | Cria as tabelas (se não existirem), limpa e insere dados de exemplo |
| `npm run db:select` | Exemplos de `SELECT` com `JOIN` (1:N, 1:1, N:N) |
| `npm run db:update` | Exemplos de `UPDATE` (inclusive FOREIGN KEY inválida bloqueada) |
| `npm run db:delete` | Exemplos de `DELETE` (`ON DELETE CASCADE` / `SET NULL`) |
| `npm test` | Testes automáticos com `node:test` (usam um banco separado, `test.db`) |

## 6. Estrutura do projeto

```
├── public/                    # arquivos estáticos
│   ├── scripts/               # bootstrap.bundle.min.js, common.js, products.js, product-details.js, site.js
│   └── styles/                # bootstrap.min.css, site.css
├── rest_client/api.http       # requisições para o REST Client
├── src/
│   ├── app.js                 # configuração do Express (EJS, middlewares, rotas)
│   ├── server.js              # ponto de entrada (app.listen)
│   ├── controllers/           # api, products, produtos, marcas, categorias, usuarios
│   ├── db_config/             # database.js (cria tabelas) e connection.js (conexão única)
│   ├── databases/             # info.db (gerado, fora do Git)
│   ├── middlewares/           # debug, mcors, verify.id, validate.produto, errors (404 + 500)
│   ├── models/                # SQL de cada tabela (prepared statements)
│   ├── routes/                # rotas da API e das páginas
│   ├── scripts/               # populate, select, update, delete e consultas.sql
│   └── views/                 # layout.ejs, partials/ (header, footer) e páginas
├── tests/api.test.js          # testes automáticos
├── COMMANDS.md · INFO.md · LICENSE · .env.example
└── package.json
```

## 7. Banco de dados (SQLite)

Arquivo: `src/databases/info.db` (criado automaticamente). `PRAGMA foreign_keys = ON` é ativado em toda conexão.

| Tabela | Colunas principais | Relacionamento |
| --- | --- | --- |
| `usuarios` | id, nome, email (UNIQUE), idade, altura, ativo, saldo, criado_em, ultimo_login | — |
| `marcas` | id, nome | 1 marca → N produtos |
| `produtos` | id, nome, disponibilidade, preco, estoque, marca_id → marcas, imagem_url, descricao | `ON DELETE SET NULL` para marca |
| `detalhes_produto` | id, produto_id (UNIQUE) → produtos, tamanho, condicao | 1:1 com produtos, `ON DELETE CASCADE` |
| `categorias` | id, nome (UNIQUE) | — |
| `produtos_categorias` | produto_id, categoria_id (PK composta) | N:N, `ON DELETE CASCADE` |

## 8. Rotas

### Gerais (Lecture001 e Board ApiN2V1)

| Método | Rota | Resposta |
| --- | --- | --- |
| GET | `/` | `{ message: "Servidor em Execução", success: true }` |
| GET | `/equipe` | Integrantes da equipe |
| GET | `/api/info` | Status da API |
| GET | `/api/info/:id` | 200 se id = 42, 400 se não for número, 500 (errorHandler) caso contrário |
| GET | `/api/home` | `{ titulo: "Brechó Online" }` |
| GET | `/api/products` | `{ productsList: [...] }` (produtos do banco) |
| GET | `/api/products/:id` | Um produto ou 404 |

### CRUD de produtos

| Método | Rota | Descrição | Status |
| --- | --- | --- | --- |
| GET | `/api/produtos` | Lista todos (`?q=termo` busca por nome, marca ou categoria) | 200 |
| GET | `/api/produtos/:id` | Busca por id | 200 / 400 / 404 |
| POST | `/api/produtos` | Cria produto | 201 / 400 |
| PUT | `/api/produtos/:id` | Substitui o produto inteiro | 200 / 400 / 404 |
| PATCH | `/api/produtos/:id` | Atualiza só os campos enviados | 200 / 400 / 404 |
| DELETE | `/api/produtos/:id` | Remove produto | 200 / 404 |
| POST | `/api/produtos/:produtoId/categorias/:categoriaId` | Vincula categoria (N:N) | 201 / 400 / 404 |
| DELETE | `/api/produtos/:produtoId/categorias/:categoriaId` | Remove vínculo | 200 / 404 |

Exemplo de corpo (POST/PUT) — só `nome` é obrigatório:

```json
{
  "nome": "Jaqueta Jeans Oversized",
  "preco": 120.0,
  "disponivel": true,
  "estoque": 3,
  "marca_id": 1,
  "tamanho": "GG",
  "condicao": "Seminovo",
  "imagem_url": "https://exemplo.com/foto-da-peca.jpg",
  "descricao": "Peça em ótimo estado de conservação.",
  "categoria_ids": [1, 2]
}
```

### Marcas, categorias e usuários

`GET/POST /api/marcas`, `GET/PUT/DELETE /api/marcas/:id` (o GET por id traz os produtos da marca) ·
`GET/POST /api/categorias`, `GET/PUT/DELETE /api/categorias/:id` ·
`GET/POST /api/usuarios`, `GET/DELETE /api/usuarios/:id`

### Páginas (EJS)

`/home` · `/about` · `/contact` · `/products` · `/products/:id`

Erros: rota inexistente → **404** (`notFound`); exceções → **500** (`errorHandler`); dados inválidos ou FOREIGN KEY/UNIQUE violada → **400**.

## 9. Entrega ao professor

1. Repositório **privado** no GitHub com o professor e as integrantes como colaboradores.
2. Cada integrante faz seus próprios commits (ver `COMMANDS.md`).
3. Enviar o link do repositório conforme orientação da disciplina.

## Licença

[MIT](LICENSE)
