import { Router } from "express";

const router = Router();

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
router.get("/products/:id", (req, res) => {
  res.render("product-details", { titulo: "Detalhes do Produto" }); // o cliente obterá os dados via fetch
});

export { router };
