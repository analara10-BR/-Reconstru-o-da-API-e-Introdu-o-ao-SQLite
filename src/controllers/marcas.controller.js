import MarcasModel from "../models/marcas.model.js";

const nomeValido = (nome) => typeof nome === "string" && nome.trim() !== "";

export default class MarcasController {
  constructor() {
    this.model = new MarcasModel();
  }

  async getMarcas(req, res, next) {
    try {
      res.status(200).json(this.model.findAll());
    } catch (error) {
      next(error);
    }
  }

  async getMarcaById(req, res, next) {
    try {
      const marca = this.model.findById(Number(req.params.id));
      if (!marca) return res.status(404).json({ message: "Marca não encontrada!" });
      res.status(200).json(marca);
    } catch (error) {
      next(error);
    }
  }

  async createMarca(req, res, next) {
    try {
      if (!nomeValido(req.body?.nome)) return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
      res.status(201).json({ message: "Marca cadastrada!", marca: this.model.create(req.body.nome) });
    } catch (error) {
      next(error);
    }
  }

  async updateMarca(req, res, next) {
    try {
      if (!nomeValido(req.body?.nome)) return res.status(400).json({ message: "O campo 'nome' é obrigatório." });
      const marca = this.model.update(Number(req.params.id), req.body.nome);
      if (!marca) return res.status(404).json({ message: "Marca não encontrada!" });
      res.status(200).json({ message: "Marca atualizada!", marca });
    } catch (error) {
      next(error);
    }
  }

  async deleteMarca(req, res, next) {
    try {
      const marca = this.model.remove(Number(req.params.id));
      if (!marca) return res.status(404).json({ message: "Marca não encontrada!" });
      res.status(200).json({ message: "Marca deletada! Os produtos dela ficaram sem marca (ON DELETE SET NULL).", marca });
    } catch (error) {
      next(error);
    }
  }
}
