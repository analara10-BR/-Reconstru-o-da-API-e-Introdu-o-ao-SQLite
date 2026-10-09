import LivrosModel from "../models/livros.model.js";
import { handleSqliteError } from "./sqlite.errors.js";

export default class LivrosController {
  constructor() {
    this.model = new LivrosModel();
  }

  // GET /api/livros  (opcional: ?q=termo)
  async getLivros(req, res, next) {
    try {
      const busca = String(req.query.q ?? "").trim();
      const livros = this.model.findAll(busca);

      if (!livros || livros.length === 0) {
        return res.status(404).json({ message: "Nenhum livro encontrado!" });
      }

      res.status(200).json(livros);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/livros/:livroId
  async getLivroById(req, res, next) {
    try {
      const livro = this.model.findById(Number(req.params.livroId));

      if (!livro) {
        return res.status(404).json({ message: "Livro não encontrado!" });
      }

      res.status(200).json(livro);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/livros
  async createLivro(req, res, next) {
    try {
      const novoLivro = this.model.create(req.body);
      return res.status(201).json({ message: "Novo livro cadastrado!", livro: novoLivro });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // PUT /api/livros/:livroId
  async updateLivro(req, res, next) {
    try {
      const livro = this.model.replace(Number(req.params.livroId), req.body);

      if (!livro) {
        return res.status(404).json({ message: "Livro não encontrado!" });
      }

      return res.status(200).json({ message: "Livro atualizado!", livro });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // PATCH /api/livros/:livroId
  async patchLivro(req, res, next) {
    try {
      const livro = this.model.update(Number(req.params.livroId), req.body);

      if (!livro) {
        return res.status(404).json({ message: "Livro não encontrado!" });
      }

      return res.status(200).json({ message: "Livro atualizado!", livro });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // DELETE /api/livros/:livroId
  async deleteLivro(req, res, next) {
    try {
      const deletedLivro = this.model.remove(Number(req.params.livroId));

      if (!deletedLivro) {
        return res.status(404).json({ message: "Livro não encontrado!" });
      }

      return res.status(200).json({ message: "Livro deletado!", livro: deletedLivro });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/livros/:livroId/categorias/:categoriaId  (vínculo N:N)
  async addCategoria(req, res, next) {
    try {
      const livroId = Number(req.params.livroId);
      if (!this.model.findById(livroId)) {
        return res.status(404).json({ message: "Livro não encontrado!" });
      }
      this.model.addCategoria(livroId, Number(req.params.categoriaId));
      return res.status(201).json({ message: "Categoria vinculada ao livro!", livro: this.model.findById(livroId) });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  // DELETE /api/livros/:livroId/categorias/:categoriaId  (remove apenas o vínculo N:N)
  async removeCategoria(req, res, next) {
    try {
      const livroId = Number(req.params.livroId);
      const removidos = this.model.removeCategoria(livroId, Number(req.params.categoriaId));
      if (removidos === 0) {
        return res.status(404).json({ message: "Vínculo entre livro e categoria não encontrado!" });
      }
      return res.status(200).json({ message: "Vínculo removido!", livro: this.model.findById(livroId) });
    } catch (error) {
      next(error);
    }
  }
}
