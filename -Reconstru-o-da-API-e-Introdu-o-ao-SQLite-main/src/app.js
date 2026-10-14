import express from "express";
import path from "node:path";
import expressLayouts from "express-ejs-layouts";

import db from "./db_config/connection.js";
import { router as apiRouter } from "./routes/api.routes.js";
import { router as productsRouter } from "./routes/products.routes.js";
import { router as produtosRouter } from "./routes/produtos.routes.js";
import { router as marcasRouter } from "./routes/marcas.routes.js";
import { router as categoriasRouter } from "./routes/categorias.routes.js";
import { router as usuariosRouter } from "./routes/usuarios.routes.js";
import { router as viewsRouter } from "./routes/views.routes.js";
import { mdebug } from "./middlewares/debug.middleware.js";
import { notFound, errorHandler } from "./middlewares/errors.middleware.js";
import { mcors } from "./middlewares/mcors.middleware.js";

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
app.use(express.json()); // Middleware global para lidar com JSON
app.use(mdebug);

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
app.use("/api", marcasRouter);
app.use("/api", categoriasRouter);
app.use("/api", usuariosRouter);

// Rotas das páginas (EJS)
app.use("/", viewsRouter);

// Após todas as rotas, há o tratamento de erro para uma rota inexistente
// Se nenhuma das rotas funcionar, será enviado um erro 404 ao cliente.
app.use(notFound);

// Middleware de erro
app.use(errorHandler);

export { db };
export default app;
