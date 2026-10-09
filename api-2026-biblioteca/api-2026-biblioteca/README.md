# Biblioteca Aurora — Projeto Backend 2026

Projeto didático construído com Node.js, Express, arquitetura de rotas/controllers/middlewares, páginas EJS e SQLite. A estrutura e os conteúdos seguem os tópicos dos materiais da disciplina: API REST CRUD, EJS/layouts/partials e relacionamentos SQLite.

## Requisitos
- Node.js 20.11+ (recomendado)
- npm

## Instalação e execução
```bash
npm install
npm run db:populate
npm run dev
```
Acesse http://localhost:3000. Para testar a API, use `rest_client/api.http` com a extensão REST Client do VS Code.

## Páginas
- `/` e `/home` — início
- `/about` — sobre o projeto
- `/contact` — contato
- `/products` — catálogo
- `/products/:id` — detalhes de um livro/produto

## API REST
- `GET /api` — status da API
- `GET /api/livros` — lista livros (aceita `?q=termo`)
- `GET /api/livros/:livroId` — consulta por ID
- `POST /api/livros` — cria livro
- `PUT /api/livros/:livroId` — substitui dados do livro
- `PATCH /api/livros/:livroId` — atualiza parcialmente
- `DELETE /api/livros/:livroId` — exclui livro
- `GET /api/categorias` — lista categorias
- `GET /api/autores` — lista autores

### Exemplo POST
```json
{
  "titulo": "Livro de exemplo",
  "ano": 2024,
  "disponivel": true,
  "exemplares": 3,
  "autor_id": 1,
  "categoria_ids": [1, 2],
  "isbn": "978-00-0000000-0",
  "editora": "Editora Exemplo"
}
```

## Banco de dados
O arquivo SQLite é criado em `src/databases/info.db` na primeira execução. As tabelas incluem `usuarios`, `categorias`, `autores`, `livros`, `detalhes_livro` e `livros_categorias`, demonstrando relacionamentos 1:N, 1:1 e N:N. Execute `npm run db:populate` para inserir dados de demonstração. O script evita duplicar a carga inicial.

## Estrutura
```text
public/
  scripts/
  styles/
rest_client/api.http
src/
  controllers/
  db_config/database.js
  databases/.gitkeep
  middlewares/
  routes/
  scripts/populate.js
  views/
    partials/
  app.js
  server.js
```

## GitHub
Crie um repositório chamado `api-2026-biblioteca` no GitHub e envie os arquivos:
```bash
git init
git add .
git commit -m "feat: estrutura inicial da biblioteca com API REST e SQLite"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/api-2026-biblioteca.git
git push -u origin main
```
Substitua `SEU-USUARIO` pelo seu usuário GitHub. Convide os integrantes e o professor conforme as instruções da disciplina. Cada integrante deve realizar commits próprios e identificáveis.
