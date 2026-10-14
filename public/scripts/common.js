// Funções compartilhadas pelas páginas do catálogo.
function escapeHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === "") return "Consulte o preço";
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mostrarMensagem(texto, tipo = "success") {
  const alvo = document.getElementById("mensagem");
  if (!alvo) return;
  alvo.innerHTML = `<div class="alert alert-${escapeHtml(tipo)}" role="status">${escapeHtml(texto)}</div>`;
}

async function carregarOpcoes(marcaSelecionado = null, categoriasSelecionadas = []) {
  const [marcasResponse, categoriasResponse] = await Promise.all([
    fetch("/api/marcas"), fetch("/api/categorias"),
  ]);
  if (!marcasResponse.ok || !categoriasResponse.ok) throw new Error("Não foi possível carregar marcas e categorias.");
  const [marcas, categorias] = await Promise.all([marcasResponse.json(), categoriasResponse.json()]);

  const select = document.getElementById("marca_id");
  if (select) {
    select.innerHTML = '<option value="">Sem marca</option>' + marcas.map((marca) =>
      `<option value="${Number(marca.id)}" ${Number(marca.id) === Number(marcaSelecionado) ? "selected" : ""}>${escapeHtml(marca.nome)}</option>`
    ).join("");
  }

  const checks = document.getElementById("categorias-checks");
  if (checks) {
    checks.innerHTML = categorias.map((categoria) => `
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${Number(categoria.id)}" id="cat-${Number(categoria.id)}"
          ${categoriasSelecionadas.map(Number).includes(Number(categoria.id)) ? "checked" : ""} />
        <label class="form-check-label" for="cat-${Number(categoria.id)}">${escapeHtml(categoria.nome)}</label>
      </div>`).join("");
  }
}

function lerFormulario() {
  const valor = (id) => document.getElementById(id)?.value.trim() ?? "";
  const numeroOuNull = (id) => (valor(id) === "" ? null : Number(valor(id)));
  return {
    nome: valor("nome"), preco: numeroOuNull("preco"), estoque: numeroOuNull("estoque") ?? 1,
    disponivel: document.getElementById("disponivel")?.checked ?? true,
    marca_id: numeroOuNull("marca_id"), tamanho: valor("tamanho") || null,
    condicao: valor("condicao") || null, imagem_url: valor("imagem_url") || null,
    descricao: valor("descricao") || null,
    categoria_ids: [...document.querySelectorAll("#categorias-checks input:checked")].map((el) => Number(el.value)),
  };
}

async function respostaJson(response) {
  let dados;
  try { dados = await response.json(); } catch { dados = {}; }
  if (!response.ok) {
    const detalhes = dados.erros ? ` ${dados.erros.join(" ")}` : "";
    throw new Error(`${dados.message ?? "Erro na requisição."}${detalhes}`);
  }
  return dados;
}

// Fotos ilustrativas para produtos que ainda não possuem uma imagem cadastrada.
const fotosPorTipo = {
  roupa: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
  vestido: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
  blazer: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
  calca: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
  tenis: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  moletom: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
  acessorio: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
};
function imagemDoProduto(produto) {
  if (produto.imagem_url) return produto.imagem_url;
  const texto = `${produto.nome ?? ""} ${(produto.categorias ?? []).join(" ")}`.toLowerCase();
  if (texto.includes("vestido")) return fotosPorTipo.vestido;
  if (texto.includes("blazer")) return fotosPorTipo.blazer;
  if (texto.includes("calça") || texto.includes("calca")) return fotosPorTipo.calca;
  if (texto.includes("tênis") || texto.includes("tenis") || texto.includes("sapato")) return fotosPorTipo.tenis;
  if (texto.includes("moletom")) return fotosPorTipo.moletom;
  if (texto.includes("bolsa") || texto.includes("acessório") || texto.includes("acessorio")) return fotosPorTipo.acessorio;
  return fotosPorTipo.roupa;
}
function criarImagem(produto, classe = "") {
  const url = escapeHtml(imagemDoProduto(produto));
  const alt = escapeHtml(`Foto ilustrativa de ${produto.nome ?? "peça de brechó"}`);
  return `<img class="${classe}" src="${url}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${fotosPorTipo.roupa}'" />`;
}
