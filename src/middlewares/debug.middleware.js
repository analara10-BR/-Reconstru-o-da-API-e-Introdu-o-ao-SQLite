// Exemplo de Middleware Global customizado
export const mdebug = (request, response, next) => {
  const now = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  console.log();
  console.log(`${now} IP:${request.ip}`);
  console.log(`Método HTTP: ${request.method} URL: ${request.url}`);
  console.log("Body:", request.body);
  next(); // para ir adiante
};
