# Atividade 01 — Reconstrução da API e Introdução ao SQLite

**Brechó Raiz** — catálogo de moda circular com API REST em Node.js + Express, páginas EJS + Bootstrap 5 e banco de dados SQLite (`better-sqlite3`).

**Alunas:** Leticia Ribeiro da Silva · Ana Lara Martins Inocencio · Nayelle Lima de Sousa

> Tema: brechó online (roupas e acessórios de segunda mão). O material de SQLite usa livros/autores como exemplo;


## Atualização: banco conforme o DER + login + anúncios

- Banco SQLite reorganizado nas 10 tabelas do DER: `cliente`, `endereco`, `pedido`, `item_pedido`, `produto`, `categoria`, `fornecedor`, `pagamento`, `cupom_desconto` e `entrega` (`src/db_config/database.js`), com `PRAGMA foreign_keys = ON`.
- Bancos da versão anterior são migrados automaticamente na primeira execução: é feito um backup do `.db`, os dados vão para as tabelas novas e as tabelas antigas ficam guardadas como `legado_*`.
- Cadastro, login e logout de clientes (senha com hash **scrypt**, sessão com **express-session**).
- Só quem está logado pode anunciar peças; só quem anunciou pode editar ou excluir a peça.
- Anúncio com nome, descrição, tamanho, preço, estado de conservação, disponibilidade, categoria e foto (arquivo ou link).

Explicação completa para a apresentação: [GUIA_APRESENTACAO.md](GUIA_APRESENTACAO.md).

### Como executar

```bash
npm install
cp .env.example .env      # e troque o SESSION_SECRET
npm run db:populate       # dados de exemplo (login: ze@email.com / brecho123)
npm run dev               # http://localhost:3000/home
npm test
```

Use Node.js 20 ou 22 (LTS). Em versões mais novas o `better-sqlite3` pode não ter binário pronto.
