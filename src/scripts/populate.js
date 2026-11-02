// comando: npm run db:populate   (ou: node src/scripts/populate.js)
// ATENÇÃO: este script REINICIA os dados de exemplo das tabelas do DER.
// As tabelas legado_* (dados da versão antiga) não são tocadas.

import { createDatabase } from "../db_config/database.js";
import { gerarHashSenha } from "../utils/senha.js";

const db = createDatabase(process.env.DB_NAME || "info.db");

console.log("Populando o banco de dados...");

// Limpa os dados anteriores para o script poder ser executado várias vezes.
// A ordem importa por causa das chaves estrangeiras: primeiro as tabelas "filhas"
// (que têm FK), depois as tabelas "mães" (que são referenciadas).
db.exec(`
  DELETE FROM entrega;
  DELETE FROM pagamento;
  DELETE FROM item_pedido;
  DELETE FROM pedido;
  DELETE FROM cupom_desconto;
  DELETE FROM produto;
  DELETE FROM fornecedor;
  DELETE FROM categoria;
  DELETE FROM endereco;
  DELETE FROM cliente;
  DELETE FROM sqlite_sequence WHERE name NOT LIKE 'legado_%';
`);

/* =========================
   CLIENTE (senha guardada como hash scrypt)
   Senha dos dois clientes de exemplo: brecho123
========================= */
const senhaHash = await gerarHashSenha("brecho123");
const insertCliente = db.prepare("INSERT INTO cliente (nome, email, telefone, senha_hash) VALUES (?, ?, ?, ?)");
insertCliente.run("José Silva", "ze@email.com", "(85) 99999-0001", senhaHash);
insertCliente.run("João Silva", "joao@email.com", "(85) 99999-0002", senhaHash);
console.log("cliente");
console.log(db.prepare("SELECT id_cliente, nome, email, telefone FROM cliente").all());

/* =========================
   ENDERECO (CLIENTE 1:N ENDERECO)
========================= */
const insertEndereco = db.prepare("INSERT INTO endereco (id_cliente, logradouro, numero, bairro, cidade, cep) VALUES (?, ?, ?, ?, ?, ?)");
insertEndereco.run(1, "Rua das Flores", "120", "Centro", "Fortaleza", "60000-000");
insertEndereco.run(1, "Av. Beira Mar", "900", "Meireles", "Fortaleza", "60165-121");
insertEndereco.run(2, "Rua do Sol", "45", "Benfica", "Fortaleza", "60020-181");

/* =========================
   CATEGORIA (CATEGORIA 1:N PRODUTO)
========================= */
const insertCategoria = db.prepare("INSERT INTO categoria (nome, descricao) VALUES (?, ?)");
insertCategoria.run("Feminino", "Roupas e peças femininas");
insertCategoria.run("Vintage", "Peças com estilo de outras décadas");
insertCategoria.run("Masculino", "Roupas e peças masculinas");
insertCategoria.run("Esportivo", "Tênis e roupas esportivas");
console.log("categoria");
console.log(db.prepare("SELECT * FROM categoria").all());

/* =========================
   FORNECEDOR (FORNECEDOR 1:N PRODUTO)
   1 = acervo da loja (sem conta de cliente) | 2 = José, que anuncia pelo site (id_cliente = 1)
========================= */
const insertFornecedor = db.prepare("INSERT INTO fornecedor (nome, contato, telefone, email, id_cliente) VALUES (?, ?, ?, ?, ?)");
insertFornecedor.run("Acervo Brechó Raiz", "Equipe do projeto", null, null, null);
insertFornecedor.run("José Silva", "José Silva", "(85) 99999-0001", "ze@email.com", 1);

/* =========================
   PRODUTO (FKs: id_categoria e id_fornecedor)
========================= */
const insertProduto = db.prepare(`
  INSERT INTO produto (nome, descricao, tamanho, preco, estado_conservacao, disponibilidade, id_categoria, id_fornecedor)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
insertProduto.run("Vestido Floral Midi", "Vestido leve, estampa floral e comprimento midi.", "M", 59.9, "Seminovo", 1, 1, 1);
insertProduto.run("Blazer Alfaiataria Bege", "Blazer de alfaiataria com corte reto.", "G", 89.9, "Ótimo estado", 1, 2, 1);
insertProduto.run("Calça Jeans 501", "Jeans clássico de lavagem média.", "40", 79.9, "Bom estado", 0, 3, 1);
insertProduto.run("Tênis Air Max 90", "Tênis confortável, pouco usado.", "39", 149.9, "Seminovo", 1, 4, 2);
insertProduto.run("Moletom Vintage", "Moletom estilo anos 90.", "GG", 69.9, "Bom estado", 1, 2, 2);
console.log("produto");
console.log(db.prepare("SELECT * FROM produto").all());

/* =========================
   CUPOM_DESCONTO (PK = código do cupom)
========================= */
db.prepare("INSERT INTO cupom_desconto (codigo, validade, valor) VALUES (?, ?, ?)").run("BRECHO10", "2026-12-31", 10);

/* =========================
   PEDIDO (CLIENTE 1:N PEDIDO, CUPOM 1:N PEDIDO opcional)
========================= */
const insertPedido = db.prepare("INSERT INTO pedido (data_pedido, status, valor_total, id_cliente, codigo_cupom) VALUES (?, ?, ?, ?, ?)");
insertPedido.run("2026-10-01 14:30:00", "entregue", 69.9, 2, "BRECHO10"); // com cupom
insertPedido.run("2026-10-20 10:00:00", "pendente", 69.9, 1, null); // sem cupom

/* =========================
   ITEM_PEDIDO (tabela associativa PEDIDO N:N PRODUTO)
========================= */
const insertItem = db.prepare("INSERT INTO item_pedido (id_pedido, id_produto, preco_unitario, quantidade) VALUES (?, ?, ?, ?)");
insertItem.run(1, 3, 79.9, 1);
insertItem.run(2, 5, 69.9, 1);

/* =========================
   PAGAMENTO (PEDIDO 1:N PAGAMENTO) e ENTREGA (PEDIDO 1:0..1 ENTREGA)
========================= */
db.prepare("INSERT INTO pagamento (id_pedido, data_pagamento, forma_pagamento, valor_pago, status_pagamento) VALUES (?, ?, ?, ?, ?)")
  .run(1, "2026-10-01 14:35:00", "Pix", 69.9, "aprovado");
db.prepare("INSERT INTO entrega (id_pedido, endereco_utilizado, situacao, rastreamento) VALUES (?, ?, ?, ?)")
  .run(1, "Rua do Sol, 45 - Benfica, Fortaleza", "entregue", "BR123456789");

console.log("Banco populado com sucesso!");
db.close();
