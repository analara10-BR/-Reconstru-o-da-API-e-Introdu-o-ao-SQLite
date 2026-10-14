# Comandos do projeto

```bash
npm install            # instala as dependências (express, better-sqlite3, cors, dotenv, ejs, express-ejs-layouts, nodemon)
npm run db:populate    # cria/recria os dados de exemplo no SQLite (src/databases/info.db)
npm run dev            # inicia o servidor com nodemon (reinicia ao salvar arquivos)
npm start              # inicia o servidor com node
npm test               # executa os testes automáticos da API (usa um banco separado: test.db)
```

Scripts de prática de SQL (rodar depois do `db:populate`):

```bash
npm run db:select      # consultas SELECT com JOIN (1:N, 1:1, N:N)
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
