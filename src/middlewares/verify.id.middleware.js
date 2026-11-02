// Middleware para Validação de um id
// Verifica todos os parâmetros de rota que representam um id (ex.: :id, :produtoId, :categoriaId)
const verifyParamId = (request, response, next) => {
  for (const [nome, valor] of Object.entries(request.params)) {
    if (nome === "id" || nome.endsWith("Id")) {
      const id = Number(valor);
      if (!Number.isInteger(id) || id <= 0) {
        return response.status(400).json({
          message: "Erro: Id deve ser um número!",
          parametro: nome,
          valor,
        });
      }
    }
  }
  next();
};

export default verifyParamId;
