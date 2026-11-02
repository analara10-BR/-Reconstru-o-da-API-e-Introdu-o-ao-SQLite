import { Router } from "express";

const router = Router();

// Só aceita caminhos internos (ex.: /products) para não redirecionar para outro site
const destinoSeguro = (valor) =>
  typeof valor === "string" && valor.startsWith("/") && !valor.startsWith("//") ? valor : "/products";

// --- ROTAS DE VIEW (EJS) ---
// As páginas renderizam apenas o "esqueleto"; os dados são obtidos via fetch na API.
router.get("/home", (req, res) => {
  res.render("home", { titulo: "Home" });
});
router.get("/about", (req, res) => {
  res.render("about", { titulo: "Sobre" });
});
router.get("/contact", (req, res) => {
  res.render("contact", { titulo: "Contato" });
});
router.get("/products", (req, res) => {
  res.render("products", { titulo: "Produtos" }); // o cliente obterá os dados via fetch
});
router.get("/meus-pedidos", (req, res) => {
  res.render("meus-pedidos", { titulo: "Meus pedidos" });
});
router.get("/products/:id", (req, res) => {
  res.render("product-details", { titulo: "Detalhes do Produto" }); // o cliente obterá os dados via fetch
});

// Páginas de conta: quem já está logado é levado direto para o catálogo
router.get("/login", (req, res) => {
  const voltar = destinoSeguro(req.query.voltar);
  if (req.cliente) return res.redirect(voltar);
  res.render("login", { titulo: "Entrar", voltar });
});
router.get("/cadastro", (req, res) => {
  const voltar = destinoSeguro(req.query.voltar);
  if (req.cliente) return res.redirect(voltar);
  res.render("cadastro", { titulo: "Criar conta", voltar });
});

export { router };
