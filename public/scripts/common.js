// Funções compartilhadas pelas páginas de produtos

// Evita que textos vindos da API sejam interpretados como HTML
function escapeHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// Formata o preço em reais (ex.: R$ 59,90)
function formatarPreco(valor) {
  if (valor === null || valor === undefined) return "Sem preço";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarMensagem(texto, tipo = "success") {
  document.getElementById("mensagem").innerHTML = `<div class="alert alert-${tipo}">${escapeHtml(texto)}</div>`;
}

// Preenche o <select> de marcas e os checkboxes de categorias a partir da API
async function carregarOpcoes(marcaSelecionado = null, categoriasSelecionadas = []) {
  const [marcas, categorias] = await Promise.all([
    fetch("/api/marcas").then((r) => r.json()),
    fetch("/api/categorias").then((r) => r.json()),
  ]);

  const select = document.getElementById("marca_id");
  select.innerHTML =
    '<option value="">(sem marca)</option>' +
    marcas
      .map((a) => `<option value="${a.id}" ${a.id === marcaSelecionado ? "selected" : ""}>${escapeHtml(a.nome)}</option>`)
      .join("");

  document.getElementById("categorias-checks").innerHTML = categorias
    .map(
      (c) => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${c.id}" id="cat-${c.id}"
          ${categoriasSelecionadas.includes(c.id) ? "checked" : ""} />
        <label class="form-check-label" for="cat-${c.id}">${escapeHtml(c.nome)}</label>
      </div>`,
    )
    .join("");
}

// Lê o formulário e monta o JSON esperado pela API /api/produtos
function lerFormulario() {
  const valor = (id) => document.getElementById(id).value.trim();
  const numeroOuNull = (id) => (valor(id) === "" ? null : Number(valor(id)));
  return {
    nome: valor("nome"),
    preco: numeroOuNull("preco"),
    estoque: numeroOuNull("estoque") ?? 1,
    disponivel: document.getElementById("disponivel").checked,
    marca_id: numeroOuNull("marca_id"),
    tamanho: valor("tamanho") || null,
    condicao: valor("condicao") || null,
    categoria_ids: [...document.querySelectorAll("#categorias-checks input:checked")].map((el) => Number(el.value)),
  };
}

async function respostaJson(response) {
  const dados = await response.json();
  if (!response.ok) {
    const detalhes = dados.erros ? ` ${dados.erros.join(" ")}` : "";
    throw new Error(`${dados.message ?? "Erro na requisição."}${detalhes}`);
  }
  return dados;
}
