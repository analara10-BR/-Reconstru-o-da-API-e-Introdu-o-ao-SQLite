export function verifyIdMiddleware(req, res, next) {
  const id = Number(req.params.livroId ?? req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "ID inválido. Informe um número inteiro positivo." });
  }
  req.resourceId = id;
  next();
}
