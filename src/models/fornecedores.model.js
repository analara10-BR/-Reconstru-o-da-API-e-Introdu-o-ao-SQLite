import db from "../db_config/connection.js";

// E-mail e telefone do fornecedor NÃO são enviados na API pública (são dados pessoais)
export default class FornecedoresModel {
  findAll() {
    return db
      .prepare(
        `
        SELECT f.id_fornecedor, f.nome, COUNT(p.id_produto) AS total_produtos
        FROM fornecedor f
        LEFT JOIN produto p ON p.id_fornecedor = f.id_fornecedor
        GROUP BY f.id_fornecedor
        ORDER BY f.nome
        `,
      )
      .all();
  }

  // Fornecedor + suas peças (relacionamento 1:N)
  findById(id) {
    const fornecedor = db.prepare("SELECT id_fornecedor, nome, contato FROM fornecedor WHERE id_fornecedor = ?").get(id);
    if (!fornecedor) return null;
    fornecedor.produtos = db
      .prepare("SELECT id_produto, nome, preco FROM produto WHERE id_fornecedor = ? ORDER BY nome")
      .all(id);
    return fornecedor;
  }

  findByCliente(idCliente) {
    return db.prepare("SELECT * FROM fornecedor WHERE id_cliente = ?").get(idCliente) ?? null;
  }

  /*
    Quem anuncia uma peça é o FORNECEDOR dela (relacionamento FORNECE do DER).
    Na primeira vez que um cliente anuncia, criamos o registro de fornecedor dele,
    copiando nome, e-mail e telefone da tabela cliente e guardando o id_cliente (FK).
    Nas próximas vezes, o mesmo fornecedor é reaproveitado.
  */
  obterOuCriarParaCliente(cliente) {
    const existente = this.findByCliente(cliente.id_cliente);
    if (existente) return existente;
    db.prepare(
      `
      INSERT INTO fornecedor (nome, contato, telefone, email, id_cliente)
      VALUES (?, ?, ?, ?, ?)
      `,
    ).run(cliente.nome, cliente.nome, cliente.telefone ?? null, cliente.email, cliente.id_cliente);
    return this.findByCliente(cliente.id_cliente);
  }
}
