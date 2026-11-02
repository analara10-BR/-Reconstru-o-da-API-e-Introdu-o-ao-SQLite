// Campos que nunca devem aparecer no terminal (senha) ou que são grandes demais (foto em base64)
const CAMPOS_OCULTOS = ["senha", "confirmar_senha", "senha_hash"];

const bodySeguro = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return body;
  const copia = { ...body };
  for (const campo of CAMPOS_OCULTOS) if (campo in copia) copia[campo] = "***";
  if (typeof copia.foto === "string") copia.foto = `[imagem com ${copia.foto.length} caracteres]`;
  return copia;
};

// Exemplo de Middleware Global customizado
export const mdebug = (request, response, next) => {
  const now = new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
  console.log();
  console.log(`${now} IP:${request.ip}`);
  console.log(`Método HTTP: ${request.method} URL: ${request.url}`);
  console.log("Body:", bodySeguro(request.body));
  next(); // para ir adiante
};
