function obterId() {
  const path = window.location.pathname; // Pega o caminho da URL (ex: "/products/3")
  const partes = path.split("/");
  return partes[partes.length - 1]; // Divide a string pelas barras e pega o último elemento
}

async function carregarDetalhesProduto() {
  const id = obterId();
  console.log(id);

  const response = await fetch(`/api/products/${id}`); // Usa o ID dinâmico no fetch
  const produto = await response.json();
  const container = document.getElementById("container-produto");

  if (!response.ok) {
    container.innerHTML = `<div class="alert alert-warning">${escapeHtml(produto.message ?? "Produto não encontrado")}</div>`;
    document.getElementById("form-editar").classList.add("d-none");
    return;
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h3>${escapeHtml(produto.nome)}</h3>
        <p><span class="badge ${produto.disponivel ? "text-bg-success" : "text-bg-secondary"}">
          ${produto.disponivel ? "Disponível" : "Esgotado"}</span></p>
        <dl class="row mb-0">
          <dt class="col-sm-3">ID</dt><dd class="col-sm-9">${produto.id}</dd>
          <dt class="col-sm-3">Marca</dt><dd class="col-sm-9">${escapeHtml(produto.marca ?? "Não informado")}</dd>
          <dt class="col-sm-3">Preço</dt><dd class="col-sm-9">${formatarPreco(produto.preco)}</dd>
          <dt class="col-sm-3">Estoque</dt><dd class="col-sm-9">${produto.estoque}</dd>
          <dt class="col-sm-3">Categorias</dt><dd class="col-sm-9">${escapeHtml(produto.categorias.join(", ") || "-")}</dd>
          <dt class="col-sm-3">Tamanho</dt><dd class="col-sm-9">${escapeHtml(produto.tamanho ?? "-")}</dd>
          <dt class="col-sm-3">Condição</dt><dd class="col-sm-9">${escapeHtml(produto.condicao ?? "-")}</dd>
        </dl>
      </div>
    </div>
  `;

  await preencherFormulario(id);
}

// Busca o produto completo em /api/produtos/:id para preencher o formulário de edição
async function preencherFormulario(id) {
  const produto = await fetch(`/api/produtos/${id}`).then((r) => r.json());
  document.getElementById("nome").value = produto.nome;
  document.getElementById("preco").value = produto.preco ?? "";
  document.getElementById("estoque").value = produto.estoque;
  document.getElementById("tamanho").value = produto.tamanho ?? "";
  document.getElementById("condicao").value = produto.condicao ?? "";
  document.getElementById("disponivel").checked = produto.disponivel;
  await carregarOpcoes(produto.marca_id, produto.categoria_ids);
  document.getElementById("form-editar").classList.remove("d-none");
}

async function salvarAlteracoes(evento) {
  evento.preventDefault();
  try {
    const response = await fetch(`/api/produtos/${obterId()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lerFormulario()),
    });
    const dados = await respostaJson(response);
    mostrarMensagem(dados.message);
    await carregarDetalhesProduto();
  } catch (error) {
    mostrarMensagem(error.message, "danger");
  }
}

async function excluirProduto() {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;
  try {
    const response = await fetch(`/api/produtos/${obterId()}`, { method: "DELETE" });
    const dados = await respostaJson(response);
    mostrarMensagem(`${dados.message} Redirecionando...`);
    setTimeout(() => (window.location.href = "/products"), 1200);
  } catch (error) {
    mostrarMensagem(error.message, "danger");
  }
}

window.onload = () => {
  carregarDetalhesProduto();
  document.getElementById("form-editar").addEventListener("submit", salvarAlteracoes);
  document.getElementById("btn-excluir").addEventListener("click", excluirProduto);
};
