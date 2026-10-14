import ProdutosModel from "../models/produtos.model.js";
import { handleSqliteError } from "./sqlite.errors.js";

export default class ProdutosController {
  constructor() {
    this.model = new ProdutosModel();
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

  // POST /api/produtos
  async createProduto(req, res, next) {
    try {
      const novoProduto = this.model.create(req.body);
      return res.status(201).json({ message: "Novo produto cadastrado!", produto: novoProduto });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // PUT /api/produtos/:produtoId
  async updateProduto(req, res, next) {
    try {
      const produto = this.model.replace(Number(req.params.produtoId), req.body);

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado!" });
      }

      return res.status(200).json({ message: "Produto atualizado!", produto });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // PATCH /api/produtos/:produtoId
  async patchProduto(req, res, next) {
    try {
      const produto = this.model.update(Number(req.params.produtoId), req.body);

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado!" });
      }

      return res.status(200).json({ message: "Produto atualizado!", produto });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // DELETE /api/produtos/:produtoId
  async deleteProduto(req, res, next) {
    try {
      const deletedProduto = this.model.remove(Number(req.params.produtoId));

      if (!deletedProduto) {
        return res.status(404).json({ message: "Produto não encontrado!" });
      }

      return res.status(200).json({ message: "Produto deletado!", produto: deletedProduto });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/produtos/:produtoId/categorias/:categoriaId  (vínculo N:N)
  async addCategoria(req, res, next) {
    try {
      const produtoId = Number(req.params.produtoId);
      if (!this.model.findById(produtoId)) {
        return res.status(404).json({ message: "Produto não encontrado!" });
      }
      this.model.addCategoria(produtoId, Number(req.params.categoriaId));
      return res.status(201).json({ message: "Categoria vinculada ao produto!", produto: this.model.findById(produtoId) });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // DELETE /api/produtos/:produtoId/categorias/:categoriaId  (remove apenas o vínculo N:N)
  async removeCategoria(req, res, next) {
    try {
      const produtoId = Number(req.params.produtoId);
      const removidos = this.model.removeCategoria(produtoId, Number(req.params.categoriaId));
      if (removidos === 0) {
        return res.status(404).json({ message: "Vínculo entre produto e categoria não encontrado!" });
      }
      return res.status(200).json({ message: "Vínculo removido!", produto: this.model.findById(produtoId) });
    } catch (error) {
      next(error);
    }
  }
}
