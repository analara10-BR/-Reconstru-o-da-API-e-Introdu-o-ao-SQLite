import crypto from "node:crypto";
import express from "express";
import session from "express-session";
import path from "node:path";
import expressLayouts from "express-ejs-layouts";

import db from "./db_config/connection.js";
import { router as apiRouter } from "./routes/api.routes.js";
import { router as productsRouter } from "./routes/products.routes.js";
import { router as produtosRouter } from "./routes/produtos.routes.js";
import { router as fornecedoresRouter } from "./routes/fornecedores.routes.js";
import { router as categoriasRouter } from "./routes/categorias.routes.js";
import { router as authRouter } from "./routes/auth.routes.js";
import { router as pedidosRouter } from "./routes/pedidos.routes.js";
import { router as viewsRouter } from "./routes/views.routes.js";
import { mdebug } from "./middlewares/debug.middleware.js";
import { notFound, errorHandler } from "./middlewares/errors.middleware.js";
import { mcors } from "./middlewares/mcors.middleware.js";
import { carregarUsuario } from "./middlewares/auth.middleware.js";
import { NOME_COOKIE } from "./controllers/auth.controller.js";

const app = express();

// Configurações do EJS (Node.js 20.11+ para import.meta.dirname)
app.set("view engine", "ejs");
app.set("views", path.join(import.meta.dirname, "views"));

// Página de layout (Passo 8): todas as views são inseridas em views/layout.ejs
app.use(expressLayouts);
app.set("layout", "layout");

// Registra Middlewares na Aplicação
// A pasta public/ fica na raiz do projeto (um nível acima de src/)
app.use(express.static(path.join(import.meta.dirname, "..", "public")));
app.use(mcors); // CORS (Cross-Origin Resource Sharing)
app.use(express.json({ limit: "4mb" })); // Middleware global para lidar com JSON (limite maior por causa da foto)
app.use(mdebug);

/*
  SESSÃO (express-session)
  Depois do login, o servidor guarda o id do cliente na sessão e envia ao navegador
  apenas um cookie com o ID DA SESSÃO (não com os dados do usuário nem a senha).
  - secret: chave usada para assinar o cookie (vem do arquivo .env, que não vai para o Git)
  - httpOnly: o JavaScript da página não consegue ler o cookie
  - sameSite "lax": o cookie não é enviado em POSTs vindos de outros sites
  - maxAge: a sessão expira em 2 horas
*/
if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== "test") {
  console.warn("SESSION_SECRET não definido no .env: usando uma chave temporária (os logins caem ao reiniciar).");
}
app.use(
  session({
    name: NOME_COOKIE,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2 * 60 * 60 * 1000,
    },
  }),
);
app.use(carregarUsuario); // deixa o cliente logado em req.cliente e nas views

// Rotas iniciais (Lecture001)
app.get("/", (req, res) => {
  res.send({ message: "Servidor em Execução", success: true });
});

app.get("/equipe", (req, res) => {
  res.send([
    { nome: "Ana Lara Martins Inocencio", curso: "TI" },
    { nome: "Leticia Ribeiro da Silva", curso: "TI" },
    { nome: "Nayelle Lima de Sousa", curso: "TI" },
  ]);
});

// Rotas da API (JSON)
app.use("/api", apiRouter);
app.use("/api", productsRouter);
app.use("/api", produtosRouter);
app.use("/api", categoriasRouter);
app.use("/api", fornecedoresRouter);
app.use("/api", authRouter);
app.use("/api", pedidosRouter);

// Rotas das páginas (EJS)
app.use("/", viewsRouter);

// Após todas as rotas, há o tratamento de erro para uma rota inexistente
// Se nenhuma das rotas funcionar, será enviado um erro 404 ao cliente.
app.use(notFound);

// Middleware de erro
app.use(errorHandler);

export { db };
export default app;
