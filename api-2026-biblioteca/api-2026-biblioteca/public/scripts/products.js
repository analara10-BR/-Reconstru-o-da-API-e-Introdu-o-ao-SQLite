async function carregarProdutos() {
  const container = document.getElementById("container-produtos");
  if (!container) return;
  container.innerHTML = '<div class="col-12"><p>Carregando catálogo...</p></div>';
  try {
    const params = new URLSearchParams(window.location.search);
    const response = await fetch(`/api/livros?${params.toString()}`);
    if (!response.ok) throw new Error("Não foi possível carregar o catálogo.");
    const dados = await response.json();
    const livros = dados.livros || [];
    if (!livros.length) {
      container.innerHTML = '<div class="col-12"><div class="empty-state"><h3>Nenhum livro encontrado</h3><p>Tente mudar a busca.</p></div></div>';
      return;
    }
    container.innerHTML = livros.map((livro) => `
      <div class="col-sm-6 col-lg-4">
        <article class="book-card">
          <div class="book-cover" aria-hidden="true">📚</div>
          <span class="pill ${livro.disponivel ? "" : "out"}">${livro.disponivel ? "Disponível" : "Indisponível"}</span>
          <h3 class="h4 mt-3">${escapeHtml(livro.titulo)}</h3>
          <p class="book-meta mb-1">${escapeHtml(livro.autor || "Autor não informado")} · ${livro.ano ?? "Ano desconhecido"}</p>
          <p class="book-meta">${escapeHtml((livro.categorias || []).join(", ") || "Sem categoria")}</p>
          <a class="btn btn-brand mt-2" href="/products/${livro.id}">Ver detalhes</a>
        </article>
      </div>`).join("");
  } catch (error) {
    container.innerHTML = `<div class="col-12"><div class="alert alert-danger">${escapeHtml(error.message)}</div></div>`;
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
window.addEventListener("DOMContentLoaded", carregarProdutos);
