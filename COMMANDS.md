# Comandos do projeto

```bash
npm install            # instala as dependências (express, express-session, better-sqlite3, cors, dotenv, ejs, express-ejs-layouts, nodemon)
cp .env.example .env   # configura PORT, DB_NAME e SESSION_SECRET
npm run db:populate    # recria os dados de exemplo das tabelas do DER (src/databases/info.db); senha dos clientes: brecho123
npm run dev            # inicia o servidor com nodemon (reinicia ao salvar arquivos)
npm start              # inicia o servidor com node
npm test               # executa os testes (tests/api.test.js e tests/migracao.test.js, com bancos separados)
```

Scripts de prática de SQL (rodar depois do `db:populate`):

```bash
npm run db:select      # consultas SELECT com JOIN (1:N, N:N via item_pedido, LEFT JOIN)
npm run db:update      # comandos UPDATE do material
npm run db:delete      # comandos DELETE do material (depois rode db:populate para restaurar)
```

Git (cada integrante deve fazer seus próprios commits):

```bash
git config --local user.email "voce@aluno.ifce.edu.br"
git config --local user.name "Seu Nome"
git status
git add .
git commit -m "feat:cria-funcionalidade-xyz"
git pull
git push
```
