import ProdutosModel from "../models/produtos.model.js";
import FornecedoresModel from "../models/fornecedores.model.js";
import { handleSqliteError } from "./sqlite.errors.js";
import { salvarFoto } from "../utils/foto.js";

// Se veio um arquivo de foto, salva em public/uploads e usa o caminho dele como imagem_url
const prepararDados = (body) => {
  const dados = { ...body };
  if (dados.foto) dados.imagem_url = salvarFoto(dados.foto);
  delete dados.foto;
  return dados;
};

export default class ProdutosController {
  constructor() {
    this.model = new ProdutosModel();
    this.fornecedores = new FornecedoresModel();
  }

  /*
    Verifica se o produto existe e se pertence a quem está logado.
    O dono do anúncio é o cliente ligado ao fornecedor do produto (fornecedor.id_cliente).
    Retorna o produto ou já envia a resposta de erro (404/403).
  */
  buscarProdutoDoCliente(req, res) {
    const produto = this.model.findById(Number(req.params.produtoId));
    if (!produto) {
      res.status(404).json({ message: "Produto não encontrado!" });
      return null;
    }
    if (produto.id_cliente_anunciante !== req.cliente.id_cliente) {
      res.status(403).json({ message: "Você só pode alterar as peças que você anunciou." });
      return null;
    }
    return produto;
  }

  // GET /api/produtos  (opcional: ?q=termo)
  async getProdutos(req, res, next) {
    try {
      const busca = String(req.query.q ?? "").trim();
      const produtos = this.model.findAll(busca);

      if (!produtos || produtos.length === 0) {
        return res.status(404).json({ message: "Nenhum produto encontrado!" });
      }

      res.status(200).json(produtos);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/produtos/:produtoId
  async getProdutoById(req, res, next) {
    try {
      const produto = this.model.findById(Number(req.params.produtoId));

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado!" });
      }

      res.status(200).json(produto);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/produtos (rota protegida: só chega aqui quem passou pelo middleware exigirLogin)
  async createProduto(req, res, next) {
    try {
      // Quem anuncia vira (ou já é) FORNECEDOR da peça -> relacionamento FORNECE do DER
      const fornecedor = this.fornecedores.obterOuCriarParaCliente(req.cliente);
      const novoProduto = this.model.create({ ...prepararDados(req.body), id_fornecedor: fornecedor.id_fornecedor });
      return res.status(201).json({ message: "Peça anunciada com sucesso!", produto: novoProduto });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // PUT /api/produtos/:produtoId
  async updateProduto(req, res, next) {
    try {
      if (!this.buscarProdutoDoCliente(req, res)) return;
      const produto = this.model.replace(Number(req.params.produtoId), prepararDados(req.body));
      return res.status(200).json({ message: "Produto atualizado!", produto });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // PATCH /api/produtos/:produtoId
  async patchProduto(req, res, next) {
    try {
      if (!this.buscarProdutoDoCliente(req, res)) return;
      const produto = this.model.update(Number(req.params.produtoId), prepararDados(req.body));
      return res.status(200).json({ message: "Produto atualizado!", produto });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // DELETE /api/produtos/:produtoId
  async deleteProduto(req, res, next) {
    try {
      if (!this.buscarProdutoDoCliente(req, res)) return;
      const deletedProduto = this.model.remove(Number(req.params.produtoId));
      return res.status(200).json({ message: "Produto deletado!", produto: deletedProduto });
    } catch (error) {
      // Peça que já faz parte de um pedido (item_pedido) não pode ser apagada
      if (String(error.code) === "SQLITE_CONSTRAINT_FOREIGNKEY") {
        return res.status(409).json({ message: "Esta peça já faz parte de um pedido e não pode ser excluída. Marque-a como indisponível." });
      }
      next(error);
    }
  }
}
