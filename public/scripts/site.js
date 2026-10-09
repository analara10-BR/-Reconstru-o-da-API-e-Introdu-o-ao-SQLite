async function carregarDadosSite() {
  const res = await fetch("/api/home");
  const dados = await res.json();

  const h1 = document.querySelector("#titulo");
  h1.textContent = dados.titulo;

  // Números do banco de dados
  const [livros, autores, categorias] = await Promise.all([
    fetch("/api/products").then((r) => r.json()),
    fetch("/api/autores").then((r) => r.json()),
    fetch("/api/categorias").then((r) => r.json()),
  ]);
  document.querySelector("#total-livros").textContent = livros.productsList.length;
  document.querySelector("#total-autores").textContent = autores.length;
  document.querySelector("#total-categorias").textContent = categorias.length;
}

window.onload = carregarDadosSite;
