function escapar(texto) { const el = document.createElement("span"); el.textContent = String(texto ?? ""); return el.innerHTML; }
function moeda(valor) { return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
window.addEventListener("DOMContentLoaded", async () => {
  const alvo = document.getElementById("lista-meus-pedidos");
  try {
    const resposta = await fetch("/api/pedidos/meus");
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.message || "Entre na sua conta para ver seus pedidos.");
    if (!dados.pedidos.length) { alvo.innerHTML = '<div class="empty-state"><h3>Você ainda não fez pedidos</h3><p>Quando comprar uma peça, ela aparecerá aqui.</p><a class="btn btn-brand" href="/products">Explorar produtos</a></div>'; return; }
    alvo.innerHTML = `<div class="table-responsive"><table class="table align-middle"><thead><tr><th>Pedido</th><th>Peça</th><th>Data</th><th>Total</th><th>Status</th><th>Entrega</th></tr></thead><tbody>${dados.pedidos.map(p => `<tr><td>#${Number(p.id_pedido)}</td><td>${escapar(p.produto)}</td><td>${escapar(p.data_pedido)}</td><td>${moeda(p.valor_total)}</td><td>${escapar(p.status)}</td><td>${escapar(p.situacao_entrega || "Aguardando")}</td></tr>`).join("")}</tbody></table></div>`;
  } catch (erro) { alvo.innerHTML = `<div class="alert alert-warning">${escapar(erro.message)}</div><a href="/login?voltar=%2Fmeus-pedidos" class="btn btn-brand">Entrar</a>`; }
});
