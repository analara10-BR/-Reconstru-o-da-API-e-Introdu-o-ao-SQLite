import CategoriasModel from "../models/categorias.model.js";

const nomeValido = (nome) => typeof nome === "string" && nome.trim() !== "";

export default class CategoriasController {
  constructor() {
    this.model = new CategoriasModel();
  }

  async getCategorias(req, res, next) {
    try {
      res.status(200).json(this.model.findAll());
    } catch (error) {
      next(error);
    }
  }

  async getCategoriaById(req, res, next) {
    try {
      const categoria = this.model.findById(Number(req.params.id));
      if (!categoria) return res.status(404).json({ message: "Categoria não encontrada!" });
      res.status(200).json(categoria);
    } catch (error) {
      next(error);
    }
  }

  async createCategoria(req, res, next) {
    try {
      if (!nomeValido(req.body?.nome)) return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
      res.status(201).json({ message: "Categoria cadastrada!", categoria: this.model.create(req.body.nome) });
    } catch (error) {
      next(error);
    }
  }

  async updateCategoria(req, res, next) {
    try {
      if (!nomeValido(req.body?.nome)) return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
      const categoria = this.model.update(Number(req.params.id), req.body.nome);
      if (!categoria) return res.status(404).json({ message: "Categoria não encontrada!" });
      res.status(200).json({ message: "Categoria atualizada!", categoria });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategoria(req, res, next) {
    try {
      const categoria = this.model.remove(Number(req.params.id));
      if (!categoria) return res.status(404).json({ message: "Categoria não encontrada!" });
      res.status(200).json({ message: "Categoria deletada!", categoria });
    } catch (error) {
      next(error);
    }
  }
}
