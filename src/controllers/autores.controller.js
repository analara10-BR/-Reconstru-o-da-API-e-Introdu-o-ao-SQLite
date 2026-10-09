import AutoresModel from "../models/autores.model.js";

const nomeValido = (nome) => typeof nome === "string" && nome.trim() !== "";

export default class AutoresController {
  constructor() {
    this.model = new AutoresModel();
  }

  async getAutores(req, res, next) {
    try {
      res.status(200).json(this.model.findAll());
    } catch (error) {
      next(error);
    }
  }

  async getAutorById(req, res, next) {
    try {
      const autor = this.model.findById(Number(req.params.id));
      if (!autor) return res.status(404).json({ message: "Autor não encontrado!" });
      res.status(200).json(autor);
    } catch (error) {
      next(error);
    }
  }

  async createAutor(req, res, next) {
    try {
      if (!nomeValido(req.body?.nome)) return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
      res.status(201).json({ message: "Autor cadastrado!", autor: this.model.create(req.body.nome) });
    } catch (error) {
      next(error);
    }
  }

  async updateAutor(req, res, next) {
    try {
      if (!nomeValido(req.body?.nome)) return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
      const autor = this.model.update(Number(req.params.id), req.body.nome);
      if (!autor) return res.status(404).json({ message: "Autor não encontrado!" });
      res.status(200).json({ message: "Autor atualizado!", autor });
    } catch (error) {
      next(error);
    }
  }

  async deleteAutor(req, res, next) {
    try {
      const autor = this.model.remove(Number(req.params.id));
      if (!autor) return res.status(404).json({ message: "Autor não encontrado!" });
      res.status(200).json({ message: "Autor deletado! Os livros dele ficaram sem autor (ON DELETE SET NULL).", autor });
    } catch (error) {
      next(error);
    }
  }
}
