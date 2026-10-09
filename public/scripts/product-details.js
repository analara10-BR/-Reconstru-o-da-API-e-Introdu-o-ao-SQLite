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
          <dt class="col-sm-3">Autor</dt><dd class="col-sm-9">${escapeHtml(produto.autor ?? "Não informado")}</dd>
          <dt class="col-sm-3">Ano</dt><dd class="col-sm-9">${produto.ano ?? "-"}</dd>
          <dt class="col-sm-3">Exemplares</dt><dd class="col-sm-9">${produto.exemplares}</dd>
          <dt class="col-sm-3">Categorias</dt><dd class="col-sm-9">${escapeHtml(produto.categorias.join(", ") || "-")}</dd>
          <dt class="col-sm-3">ISBN</dt><dd class="col-sm-9">${escapeHtml(produto.isbn ?? "-")}</dd>
          <dt class="col-sm-3">Editora</dt><dd class="col-sm-9">${escapeHtml(produto.editora ?? "-")}</dd>
        </dl>
      </div>
    </div>
  `;

  await preencherFormulario(id);
}

// Busca o livro completo em /api/livros/:id para preencher o formulário de edição
async function preencherFormulario(id) {
  const livro = await fetch(`/api/livros/${id}`).then((r) => r.json());
  document.getElementById("titulo").value = livro.titulo;
  document.getElementById("ano").value = livro.ano ?? "";
  document.getElementById("exemplares").value = livro.exemplares;
  document.getElementById("isbn").value = livro.isbn ?? "";
  document.getElementById("editora").value = livro.editora ?? "";
  document.getElementById("disponivel").checked = livro.disponivel;
  await carregarOpcoes(livro.autor_id, livro.categoria_ids);
  document.getElementById("form-editar").classList.remove("d-none");
}

async function salvarAlteracoes(evento) {
  evento.preventDefault();
  try {
    const response = await fetch(`/api/livros/${obterId()}`, {
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

async function excluirLivro() {
  if (!confirm("Tem certeza que deseja excluir este livro?")) return;
  try {
    const response = await fetch(`/api/livros/${obterId()}`, { method: "DELETE" });
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
  document.getElementById("btn-excluir").addEventListener("click", excluirLivro);
};
