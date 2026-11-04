async function carregarDadosHome() {
  if (!document.getElementById("total-produtos")) return;
  try {
    const [produtosResponse, fornecedoresResponse, categoriasResponse] = await Promise.all([
      fetch("/api/products"), fetch("/api/fornecedores"), fetch("/api/categorias"),
    ]);
    if (!produtosResponse.ok || !fornecedoresResponse.ok || !categoriasResponse.ok) throw new Error("Não foi possível carregar os dados do catálogo.");
    const [produtos, fornecedores, categorias] = await Promise.all([produtosResponse.json(), fornecedoresResponse.json(), categoriasResponse.json()]);
    document.querySelector("#total-produtos").textContent = produtos.productsList.length;
    document.querySelector("#total-fornecedores").textContent = fornecedores.length;
    document.querySelector("#total-categorias").textContent = categorias.length;

    const destaque = document.getElementById("home-produtos");
    const lista = produtos.productsList.slice(0, 3);
    if (!lista.length) {
      destaque.innerHTML = '<div class="col-12"><div class="empty-state"><span>✳</span><h3>Os primeiros achados vêm aí</h3><p>Nosso catálogo ainda está vazio. Você pode cadastrar a primeira peça.</p><a class="btn btn-brand" href="/products#form-area">Cadastrar uma peça</a></div></div>';
      return;
    }
    destaque.innerHTML = lista.map((produto) => `
      <div class="col-sm-6 col-lg-4"><article class="product-card">
        <div class="product-photo">${criarImagem(produto)}<span class="product-status ${produto.disponivel ? "" : "sold"}">${produto.disponivel ? "Disponível" : "Indisponível"}</span></div>
        <div class="product-card-body"><div class="product-category">${escapeHtml(produto.categoria || "Peça de garimpo")}</div>
        <h3>${escapeHtml(produto.nome)}</h3><div class="product-meta"><span>${escapeHtml(produto.fornecedor || "Brechó Raiz")}</span><strong class="product-price">${formatarPreco(produto.preco)}</strong></div>
        <a class="card-link" href="/products/${Number(produto.id)}"><span>Ver detalhes da peça</span><span aria-hidden="true">↗</span></a></div>
      </article></div>`).join("");
  } catch {
    const destaque = document.getElementById("home-produtos");
    if (destaque) destaque.innerHTML = '<div class="col-12"><p class="muted-note">Não foi possível carregar os destaques agora. Visite o catálogo para tentar novamente.</p><a class="text-link" href="/products">Abrir catálogo →</a></div>';
  }
}
// Logout: o botão "Sair" do header pede ao servidor para destruir a sessão
async function sair(evento) {
  evento.preventDefault();
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/home";
}

window.addEventListener("DOMContentLoaded", () => {
  carregarDadosHome();
  document.getElementById("btn-sair")?.addEventListener("click", sair);
});
