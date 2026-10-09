async function carregarProdutos() {
  const response = await fetch("/api/products");
  const dados = await response.json();

  const container = document.getElementById("container-produtos");
  console.log(dados);

  const busca = document.getElementById("busca").value.trim().toLowerCase();
  const lista = dados["productsList"].filter((p) =>
    [p.nome, p.autor, ...p.categorias].some((texto) => String(texto ?? "").toLowerCase().includes(busca)),
  );

  if (lista.length === 0) {
    container.innerHTML = '<p class="text-muted">Nenhum produto encontrado.</p>';
    return;
  }

  container.innerHTML = lista
    .map(
      (p) => `
      <div class="col-sm-6 col-lg-4">
        <div class="card card-livro h-100">
          <div class="card-body">
            <div class="capa mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"/></svg></div>
            <h3 class="h5">${escapeHtml(p.nome)}</h3>
            <p class="text-muted mb-1">${escapeHtml(p.autor ?? "Autor não informado")} · ${p.ano ?? "s/ ano"}</p>
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

async function cadastrarLivro(evento) {
  evento.preventDefault();
  try {
    const response = await fetch("/api/livros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lerFormulario()),
    });
    const dados = await respostaJson(response);
    mostrarMensagem(`${dados.message} (id ${dados.livro.id}: ${dados.livro.titulo})`);
    evento.target.reset();
    await carregarProdutos();
  } catch (error) {
    mostrarMensagem(error.message, "danger");
  }
}

window.onload = () => {
  carregarProdutos();
  carregarOpcoes();
  document.getElementById("form-livro").addEventListener("submit", cadastrarLivro);
  document.getElementById("form-busca").addEventListener("submit", (e) => {
    e.preventDefault();
    carregarProdutos();
  });
};
