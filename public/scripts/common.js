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

// Preenche o <select> de categoria (no DER cada produto tem UMA categoria)
async function carregarOpcoes(categoriaSelecionada = null) {
  const response = await fetch("/api/categorias");
  if (!response.ok) throw new Error("Não foi possível carregar as categorias.");
  const categorias = await response.json();
  const select = document.getElementById("id_categoria");
  if (select) {
    select.innerHTML = '<option value="">Escolha…</option>' + categorias.map((categoria) =>
      `<option value="${Number(categoria.id_categoria)}" ${Number(categoria.id_categoria) === Number(categoriaSelecionada) ? "selected" : ""}>${escapeHtml(categoria.nome)}</option>`
    ).join("");
  }
}

// Lê a foto escolhida no <input type="file"> e converte para texto (data URL base64) para enviar no JSON
function lerArquivoComoDataUrl(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("Não foi possível ler a foto escolhida."));
    leitor.readAsDataURL(arquivo);
  });
}

async function lerFormulario() {
  const valor = (id) => document.getElementById(id)?.value.trim() ?? "";
  const numeroOuNull = (id) => (valor(id) === "" ? null : Number(valor(id)));
  const arquivo = document.getElementById("foto")?.files?.[0];
  if (arquivo && arquivo.size > 2 * 1024 * 1024) throw new Error("A foto deve ter no máximo 2 MB.");
  const dados = {
    nome: valor("nome"), preco: numeroOuNull("preco"), id_categoria: numeroOuNull("id_categoria"),
    disponibilidade: document.getElementById("disponibilidade")?.checked ?? true,
    tamanho: valor("tamanho") || null, estado_conservacao: valor("estado_conservacao") || null,
    imagem_url: valor("imagem_url") || null, descricao: valor("descricao") || null,
  };
  if (arquivo) dados.foto = await lerArquivoComoDataUrl(arquivo);
  return dados;
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
  const texto = `${produto.nome ?? ""} ${produto.categoria ?? ""}`.toLowerCase();
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
