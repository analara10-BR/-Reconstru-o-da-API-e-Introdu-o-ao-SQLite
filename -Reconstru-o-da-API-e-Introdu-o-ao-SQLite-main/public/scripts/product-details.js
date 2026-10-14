function obterId() {
  return window.location.pathname.split("/").filter(Boolean).at(-1);
}

async function carregarDetalhesProduto() {
  const id = obterId();
  const container = document.getElementById("container-produto");
  try {
    const response = await fetch(`/api/products/${id}`);
    const produto = await response.json();
    if (!response.ok) {
      container.innerHTML = `<div class="empty-state"><span>⌕</span><h3>Peça não encontrada</h3><p>${escapeHtml(produto.message ?? "Esse produto não está disponível no catálogo.")}</p><a class="btn btn-brand" href="/products">Voltar ao catálogo</a></div>`;
      document.getElementById("form-editar").classList.add("d-none");
      return;
    }
    const imagem = criarImagem(produto, "detail-image");
    container.innerHTML = `
      <div class="detail-layout">
        <div class="detail-photo">${imagem}<span class="product-status ${produto.disponivel ? "" : "sold"}">${produto.disponivel ? "Disponível" : "Indisponível"}</span></div>
        <div class="detail-info">
          <span class="eyebrow">${escapeHtml((produto.categorias ?? []).join(" · ") || "PEÇA DE GARIMPO")}</span>
          <h1>${escapeHtml(produto.nome)}</h1>
          <p class="detail-price">${formatarPreco(produto.preco)}</p>
          <p class="detail-description">${escapeHtml(produto.descricao || "Uma peça de segunda mão pronta para encontrar uma nova história. Confira os detalhes e o estado de conservação antes de escolher.")}</p>
          <div class="detail-facts">
            <div><dt>Marca</dt><dd>${escapeHtml(produto.marca ?? "Não informada")}</dd></div>
            <div><dt>Tamanho</dt><dd>${escapeHtml(produto.tamanho ?? "Não informado")}</dd></div>
            <div><dt>Estado da peça</dt><dd>${escapeHtml(produto.condicao ?? "Não informado")}</dd></div>
            <div><dt>Disponibilidade</dt><dd>${produto.disponivel ? "Disponível" : "Indisponível"}</dd></div>
            <div><dt>Unidades</dt><dd>${Number(produto.estoque ?? 0)}</dd></div>
          </div>
          <a class="btn btn-brand mt-4" href="/products">Continuar garimpando <span aria-hidden="true">↗</span></a>
        </div>
      </div>`;
    await preencherFormulario(id);
  } catch (error) {
    container.innerHTML = '<div class="alert alert-danger">Não foi possível carregar os detalhes. Tente novamente.</div>';
  }
}

async function preencherFormulario(id) {
  const response = await fetch(`/api/produtos/${id}`);
  const produto = await respostaJson(response);
  document.getElementById("nome").value = produto.nome ?? "";
  document.getElementById("preco").value = produto.preco ?? "";
  document.getElementById("estoque").value = produto.estoque ?? 0;
  document.getElementById("tamanho").value = produto.tamanho ?? "";
  document.getElementById("condicao").value = produto.condicao ?? "";
  document.getElementById("imagem_url").value = produto.imagem_url ?? "";
  document.getElementById("descricao").value = produto.descricao ?? "";
  document.getElementById("disponivel").checked = produto.disponivel;
  await carregarOpcoes(produto.marca_id, produto.categoria_ids);
  document.getElementById("form-editar").classList.remove("d-none");
}

async function salvarAlteracoes(evento) {
  evento.preventDefault();
  const botao = evento.submitter;
  if (botao) { botao.disabled = true; botao.textContent = "Salvando…"; }
  try {
    const response = await fetch(`/api/produtos/${obterId()}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(lerFormulario()),
    });
    const dados = await respostaJson(response);
    mostrarMensagem(dados.message);
    await carregarDetalhesProduto();
  } catch (error) { mostrarMensagem(error.message, "danger"); }
  finally { if (botao) { botao.disabled = false; botao.textContent = "Salvar alterações"; } }
}

async function excluirProduto() {
  if (!confirm("Tem certeza que deseja excluir esta peça do catálogo?")) return;
  try {
    const response = await fetch(`/api/produtos/${obterId()}`, { method: "DELETE" });
    const dados = await respostaJson(response);
    mostrarMensagem(`${dados.message} Voltando ao catálogo…`);
    window.setTimeout(() => { window.location.href = "/products"; }, 900);
  } catch (error) { mostrarMensagem(error.message, "danger"); }
}

window.addEventListener("DOMContentLoaded", () => {
  carregarDetalhesProduto();
  document.getElementById("form-editar")?.addEventListener("submit", salvarAlteracoes);
  document.getElementById("btn-excluir")?.addEventListener("click", excluirProduto);
});
