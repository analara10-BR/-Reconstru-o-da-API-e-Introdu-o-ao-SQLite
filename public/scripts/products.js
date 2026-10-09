async function carregarProdutos() {
  const response = await fetch("/api/products");
  const dados = await response.json();

  const container = document.getElementById("container-produtos");
  console.log(dados);

  const busca = document.getElementById("busca").value.trim().toLowerCase();
  const lista = dados["productsList"].filter((p) =>
    [p.nome, p.marca, ...p.categorias].some((texto) => String(texto ?? "").toLowerCase().includes(busca)),
  );

  if (lista.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum produto encontrado.</p>';
    return;
  }

  container.innerHTML = lista
    .map(
      (p) => `
      <div class="col-sm-6 col-lg-4">
        <div class="card card-produto h-100">
          <div class="card-body">
            <div class="capa mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1m3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z"/></svg></div>
            <h3 class="h5">${escapeHtml(p.nome)}</h3>
            <p class="text-muted mb-1">${escapeHtml(p.marca ?? "Marca não informada")} · ${formatarPreco(p.preco)}</p>
            <p class="small mb-2">${escapeHtml(p.categorias.join(", ") || "Sem categoria")}</p>
            <span class="badge ${p.disponivel ? "text-bg-success" : "text-bg-secondary"}">
              ${p.disponivel ? "Disponível" : "Esgotado"}
            </span>
          </div>
          <div class="card-footer bg-transparent border-0 pb-3">
            <a class="btn btn-brand btn-sm" href="/products/${p.id}">Ver detalhes</a>
          </div>
        </div>
      </div>
    `,
    )
    .join("");
}

async function cadastrarProduto(evento) {
  evento.preventDefault();
  try {
    const response = await fetch("/api/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lerFormulario()),
    });
    const dados = await respostaJson(response);
    mostrarMensagem(`${dados.message} (id ${dados.produto.id}: ${dados.produto.nome})`);
    evento.target.reset();
    await carregarProdutos();
  } catch (error) {
    mostrarMensagem(error.message, "danger");
  }
}

window.onload = () => {
  carregarProdutos();
  carregarOpcoes();
  document.getElementById("form-produto").addEventListener("submit", cadastrarProduto);
  document.getElementById("form-busca").addEventListener("submit", (e) => {
    e.preventDefault();
    carregarProdutos();
  });
};
