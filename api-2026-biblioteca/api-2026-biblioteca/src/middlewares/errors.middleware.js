export function notFoundMiddleware(req, res, next) {
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ message: "Endpoint não encontrado." });
  }
  res.status(404).render("404", { title: "Página não encontrada" });
}

export function errorsMiddleware(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
  res.status(500).render("500", { title: "Erro interno" });
}
