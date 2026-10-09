async function carregarDadosSite() {
  const res = await fetch("/api/home");
  const dados = await res.json();

  const h1 = document.querySelector("#titulo");
  h1.textContent = dados.titulo;

  // Números do banco de dados
  const [produtos, marcas, categorias] = await Promise.all([
    fetch("/api/products").then((r) => r.json()),
    fetch("/api/marcas").then((r) => r.json()),
    fetch("/api/categorias").then((r) => r.json()),
  ]);
  document.querySelector("#total-produtos").textContent = produtos.productsList.length;
  document.querySelector("#total-marcas").textContent = marcas.length;
  document.querySelector("#total-categorias").textContent = categorias.length;
}

window.onload = carregarDadosSite;
