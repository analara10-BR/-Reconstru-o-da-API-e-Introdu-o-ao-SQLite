import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import expressLayouts from "express-ejs-layouts";
import { createDatabase } from "./db_config/database.js";
import { debugMiddleware } from "./middlewares/debug.middleware.js";
import { corsMiddleware } from "./middlewares/mcors.middleware.js";
import { notFoundMiddleware, errorsMiddleware } from "./middlewares/errors.middleware.js";
import { router as apiRouter } from "./routes/api.routes.js";
import { createBooksRouter } from "./routes/books.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const db = createDatabase(process.env.DB_NAME || "info.db");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layout");
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

app.use(expressLayouts);
app.use(express.static(path.resolve(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(debugMiddleware);

app.use("/api", apiRouter);
app.use("/api", createBooksRouter(db));

app.get("/", (req, res) => res.redirect("/home"));
app.get("/home", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS total FROM livros").get().total;
  const autores = db.prepare("SELECT COUNT(*) AS total FROM autores").get().total;
  res.render("home", { title: "Início", total, autores });
});
app.get("/about", (req, res) => res.render("about", { title: "Sobre" }));
app.get("/contact", (req, res) => res.render("contact", { title: "Contato", sent: false }));
app.post("/contact", (req, res) => {
  const { nome, email, mensagem } = req.body;
  if (!nome?.trim() || !email?.trim() || !mensagem?.trim()) {
    return res.status(400).render("contact", { title: "Contato", sent: false, error: "Preencha todos os campos." });
  }
  res.render("contact", { title: "Contato", sent: true, nome: nome.trim() });
});
app.get("/products", (req, res) => res.render("products", { title: "Catálogo" }));
app.get("/products/:id", (req, res) => res.render("product-details", { title: "Detalhes do livro" }));

app.use(notFoundMiddleware);
app.use(errorsMiddleware);

export { app, db };
