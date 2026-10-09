async function carregarDetalhesProduto() {
  const container = document.getElementById("container-produto");
  if (!container) return;
  const id = window.location.pathname.split("/").filter(Boolean).pop();
  try {
    const response = await fetch(`/api/livros/${encodeURIComponent(id)}`);
    const livro = await response.json();
    if (!response.ok) throw new Error(livro.message || "Livro não encontrado.");
    container.innerHTML = `
      <div class="col-lg-8 mx-auto">
        <article class="book-card">
          <div class="book-cover" style="height:220px;font-size:4rem">📖</div>
          <span class="pill ${livro.disponivel ? "" : "out"}">${livro.disponivel ? "Disponível" : "Indisponível"}</span>
          <h1 class="h2 mt-3">${escapeHtml(livro.titulo)}</h1>
          <p class="book-meta">Por ${escapeHtml(livro.autor || "Autor não informado")} · ${livro.ano ?? "Ano desconhecido"}</p>
          <hr>
          <p><strong>Editora:</strong> ${escapeHtml(livro.editora || "Não informada")}</p>
          <p><strong>ISBN:</strong> ${escapeHtml(livro.isbn || "Não informado")}</p>
          <p><strong>Categorias:</strong> ${escapeHtml((livro.categorias || []).join(", ") || "Sem categoria")}</p>
          <p><strong>Exemplares:</strong> ${livro.exemplares ?? 0}</p>
          <a class="btn btn-brand mt-3" href="/products">Voltar ao catálogo</a>
        </article>
      </div>`;
  } catch (error) {
    container.innerHTML = `<div class="col-12"><div class="alert alert-warning">${escapeHtml(error.message)}</div><a href="/products">Voltar ao catálogo</a></div>`;
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
window.addEventListener("DOMContentLoaded", carregarDetalhesProduto);
