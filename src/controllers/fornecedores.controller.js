import FornecedoresModel from "../models/fornecedores.model.js";

export default class FornecedoresController {
  constructor() {
    this.model = new FornecedoresModel();
  }

  // GET /api/fornecedores
  async getFornecedores(req, res, next) {
    try {
      res.status(200).json(this.model.findAll());
    } catch (error) {
      next(error);
    }
  }

  // GET /api/fornecedores/:id
  async getFornecedorById(req, res, next) {
    try {
      const fornecedor = this.model.findById(Number(req.params.id));
      if (!fornecedor) return res.status(404).json({ message: "Fornecedor não encontrado!" });
      res.status(200).json(fornecedor);
    } catch (error) {
      next(error);
    }
  }
}
