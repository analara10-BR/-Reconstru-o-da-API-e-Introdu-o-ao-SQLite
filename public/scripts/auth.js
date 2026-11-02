// Envia os formulários de login e cadastro para a API e, se der certo, volta para a página de origem.
async function enviarConta(evento, url, campos) {
  evento.preventDefault();
  const form = evento.target;
  const botao = evento.submitter;
  const textoOriginal = botao?.textContent;
  const dados = Object.fromEntries(campos.map((campo) => [campo, form.elements[campo].value]));
  if (botao) { botao.disabled = true; botao.textContent = "Enviando…"; }
  try {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
    const resposta = await respostaJson(response);
    mostrarMensagem(resposta.message);
    window.location.href = form.dataset.voltar || "/products";
  } catch (error) {
    mostrarMensagem(error.message, "danger");
    if (botao) { botao.disabled = false; botao.textContent = textoOriginal; }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-login")?.addEventListener("submit", (e) => enviarConta(e, "/api/auth/login", ["email", "senha"]));
  document.getElementById("form-cadastro")?.addEventListener("submit", (e) => enviarConta(e, "/api/auth/cadastro", ["nome", "email", "telefone", "senha", "confirmar_senha"]));
});
