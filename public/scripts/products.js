let todosOsProdutos = [];

async function carregarProdutos() {
  const container = document.getElementById("container-produtos");
  const contador = document.getElementById("resultado-contagem");
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");
    const dados = await response.json();
    todosOsProdutos = Array.isArray(dados.productsList) ? dados.productsList : [];
    preencherFiltros();
    renderizarProdutos();
  } catch (error) {
    container.innerHTML = `<div class="col-12"><div class="empty-state"><span>↻</span><h3>O catálogo não carregou</h3><p>Confira se o servidor está ligado e tente novamente.</p><button class="btn btn-brand" onclick="carregarProdutos()">Tentar de novo</button></div></div>`;
    if (contador) contador.textContent = "";
  }
}

function renderizarProdutos() {
  const container = document.getElementById("container-produtos");
  const contador = document.getElementById("resultado-contagem");
  const termo = (document.getElementById("busca")?.value ?? "").trim().toLocaleLowerCase("pt-BR");
  const categoria = document.getElementById("filtro-categoria")?.value ?? "";
  const tamanho = document.getElementById("filtro-tamanho")?.value ?? "";
  const condicao = document.getElementById("filtro-condicao")?.value ?? "";
  const precoMin = document.getElementById("preco-min")?.value;
  const precoMax = document.getElementById("preco-max")?.value;
  const lista = todosOsProdutos.filter((produto) => {
    const correspondeTexto = [produto.nome, produto.marca, produto.descricao, produto.tamanho, produto.condicao, ...(produto.categorias ?? [])]
      .some((texto) => String(texto ?? "").toLocaleLowerCase("pt-BR").includes(termo));
    const correspondeCategoria = !categoria || (produto.categorias ?? []).includes(categoria);
    const correspondeTamanho = !tamanho || String(produto.tamanho ?? "") === tamanho;
    const correspondeCondicao = !condicao || String(produto.condicao ?? "") === condicao;
    const preco = Number(produto.preco);
    const correspondePrecoMin = precoMin === "" || precoMin === undefined || (Number.isFinite(preco) && preco >= Number(precoMin));
    const correspondePrecoMax = precoMax === "" || precoMax === undefined || (Number.isFinite(preco) && preco <= Number(precoMax));
    return correspondeTexto && correspondeCategoria && correspondeTamanho && correspondeCondicao && correspondePrecoMin && correspondePrecoMax;
  });
  if (contador) contador.textContent = `${lista.length} ${lista.length === 1 ? "peça encontrada" : "peças encontradas"}`;

  if (lista.length === 0) {
    const semProdutos = todosOsProdutos.length === 0;
    container.innerHTML = `<div class="col-12"><div class="empty-state"><span>${semProdutos ? "✳" : "⌕"}</span><h3>${semProdutos ? "O garimpo está começando" : "Nenhuma peça encontrada"}</h3><p>${semProdutos ? "Ainda não há produtos cadastrados. Que tal adicionar a primeira peça?" : "Tente buscar por outro nome, marca ou categoria."}</p>${semProdutos ? '<button class="btn btn-brand" type="button" data-bs-toggle="collapse" data-bs-target="#form-area">Cadastrar primeira peça</button>' : '<button class="btn btn-outline-brand" type="button" id="limpar-busca">Limpar busca</button>'}</div></div>`;
    document.getElementById("limpar-busca")?.addEventListener("click", limparFiltros);
    return;
  }

  container.innerHTML = lista.map((produto) => `
    <div class="col-sm-6 col-lg-4">
      <article class="product-card">
        <div class="product-photo">${criarImagem(produto)}<span class="product-status ${produto.disponivel ? "" : "sold"}">${produto.disponivel ? "Disponível" : "Indisponível"}</span></div>
        <div class="product-card-body">
          <div class="product-category">${escapeHtml((produto.categorias ?? []).join(" · ") || "Peça de garimpo")}</div>
          <h3>${escapeHtml(produto.nome)}</h3>
          <div class="product-meta"><span>${escapeHtml(produto.marca || "Sem marca")}${produto.tamanho ? ` · Tam. ${escapeHtml(produto.tamanho)}` : ""}</span><strong class="product-price">${formatarPreco(produto.preco)}</strong></div>
          <a class="card-link" href="/products/${Number(produto.id)}"><span>Ver detalhes da peça</span><span aria-hidden="true">↗</span></a>
        </div>
      </article>
    </div>`).join("");
}


function preencherFiltros() {
  const preencher = (id, valores, textoPadrao) => {
    const select = document.getElementById(id);
    if (!select) return;
    const atual = select.value;
    select.innerHTML = `<option value="">${textoPadrao}</option>` + valores.map((valor) => `<option value="${escapeHtml(valor)}">${escapeHtml(valor)}</option>`).join("");
    if (valores.includes(atual)) select.value = atual;
  };
  const categorias = [...new Set(todosOsProdutos.flatMap((p) => p.categorias ?? []).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const tamanhos = [...new Set(todosOsProdutos.map((p) => p.tamanho).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }));
  const condicoes = [...new Set(todosOsProdutos.map((p) => p.condicao).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  preencher("filtro-categoria", categorias, "Todas");
  preencher("filtro-tamanho", tamanhos, "Todos");
  preencher("filtro-condicao", condicoes, "Todas");
}

function limparFiltros() {
  ["busca", "filtro-categoria", "filtro-tamanho", "filtro-condicao", "preco-min", "preco-max"].forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.value = "";
  });
  renderizarProdutos();
}

async function cadastrarProduto(evento) {
  evento.preventDefault();
  const botao = evento.submitter;
  if (botao) { botao.disabled = true; botao.textContent = "Salvando…"; }
  try {
    const response = await fetch("/api/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lerFormulario()) });
    const dados = await respostaJson(response);
    mostrarMensagem(`${dados.message} A peça “${dados.produto.nome}” já está no catálogo.`);
    evento.target.reset();
    await carregarProdutos();
  } catch (error) { mostrarMensagem(error.message, "danger"); }
  finally { if (botao) { botao.disabled = false; botao.textContent = "Salvar peça"; } }
}

window.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
  carregarOpcoes().catch((error) => mostrarMensagem(error.message, "danger"));
  document.getElementById("form-produto")?.addEventListener("submit", cadastrarProduto);
  document.getElementById("form-busca")?.addEventListener("submit", (evento) => { evento.preventDefault(); renderizarProdutos(); });
  document.getElementById("busca")?.addEventListener("input", renderizarProdutos);
  ["filtro-categoria", "filtro-tamanho", "filtro-condicao", "preco-min", "preco-max"].forEach((id) => document.getElementById(id)?.addEventListener("input", renderizarProdutos));
  document.getElementById("limpar-filtros")?.addEventListener("click", limparFiltros);
});
