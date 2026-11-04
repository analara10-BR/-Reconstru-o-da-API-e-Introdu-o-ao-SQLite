import db from "../db_config/connection.js";

const texto = (valor, limite) => String(valor ?? "").trim().slice(0, limite);

export default class PedidosController {
  criar(req, res, next) {
    try {
      const idProduto = Number(req.body?.id_produto);
      const nome = texto(req.body?.nome, 120);
      const telefone = texto(req.body?.telefone, 30);
      const cep = texto(req.body?.cep, 12);
      const estado = texto(req.body?.estado, 80);
      const cidade = texto(req.body?.cidade, 100);
      const bairro = texto(req.body?.bairro, 100);
      const logradouro = texto(req.body?.logradouro, 160);
      const numero = texto(req.body?.numero, 20);
      const complemento = texto(req.body?.complemento, 100);

      if (!Number.isInteger(idProduto) || idProduto < 1 || !nome || !telefone || !cep || !estado || !cidade || !bairro || !logradouro || !numero) {
        return res.status(400).json({ message: "Preencha todos os campos obrigatórios do endereço." });
      }

      const produto = db.prepare(`SELECT p.id_produto, p.nome, p.preco, p.disponibilidade,
        f.id_cliente AS id_anunciante FROM produto p
        JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor
        WHERE p.id_produto = ?`).get(idProduto);
      if (!produto || produto.disponibilidade !== 1) {
        return res.status(409).json({ message: "Essa peça não está mais disponível." });
      }
      if (produto.id_anunciante === req.cliente.id_cliente) {
        return res.status(400).json({ message: "Você não pode comprar uma peça anunciada pela sua própria conta." });
      }
      if (!Number.isFinite(Number(produto.preco)) || Number(produto.preco) < 0) {
        return res.status(400).json({ message: "Essa peça não possui um preço válido." });
      }

      const enderecoCompleto = `${logradouro}, ${numero}${complemento ? `, ${complemento}` : ""} - ${bairro}, ${cidade} - ${estado}, CEP ${cep}`;
      const executar = db.transaction(() => {
        const endereco = db.prepare(`INSERT INTO endereco (id_cliente, logradouro, numero, bairro, cidade, cep)
          VALUES (?, ?, ?, ?, ?, ?)`)
          .run(req.cliente.id_cliente, `${logradouro}${complemento ? ` - ${complemento}` : ""}`, numero, bairro, cidade, cep);
        const pedido = db.prepare(`INSERT INTO pedido (status, valor_total, id_cliente) VALUES ('pendente', ?, ?)`)
          .run(Number(produto.preco), req.cliente.id_cliente);
        db.prepare(`INSERT INTO item_pedido (id_pedido, id_produto, preco_unitario, quantidade) VALUES (?, ?, ?, 1)`)
          .run(pedido.lastInsertRowid, idProduto, Number(produto.preco));
        db.prepare(`INSERT INTO entrega (id_pedido, endereco_utilizado, situacao) VALUES (?, ?, 'aguardando confirmação')`)
          .run(pedido.lastInsertRowid, enderecoCompleto);
        const atualizado = db.prepare(`UPDATE produto SET disponibilidade = 0 WHERE id_produto = ? AND disponibilidade = 1`).run(idProduto);
        if (!atualizado.changes) throw new Error("Essa peça acabou de ser reservada por outra pessoa. Atualize o catálogo.");
        return { id_pedido: Number(pedido.lastInsertRowid), id_endereco: Number(endereco.lastInsertRowid), valor_total: Number(produto.preco), produto: produto.nome };
      });

      const resultado = executar();
      return res.status(201).json({ message: "Pedido registrado! O brechó entrará em contato para confirmar os próximos passos.", pedido: resultado });
    } catch (error) {
      if (error.message?.includes("reservada por outra pessoa")) return res.status(409).json({ message: error.message });
      next(error);
    }
  }

  meus(req, res, next) {
    try {
      const pedidos = db.prepare(`SELECT pe.id_pedido, pe.data_pedido, pe.status, pe.valor_total,
        pr.nome AS produto, pr.id_produto, ep.endereco_utilizado, ep.situacao AS situacao_entrega
        FROM pedido pe
        JOIN item_pedido ip ON ip.id_pedido = pe.id_pedido
        JOIN produto pr ON pr.id_produto = ip.id_produto
        LEFT JOIN entrega ep ON ep.id_pedido = pe.id_pedido
        WHERE pe.id_cliente = ? ORDER BY pe.id_pedido DESC`).all(req.cliente.id_cliente);
      return res.json({ pedidos });
    } catch (error) { next(error); }
  }
}
