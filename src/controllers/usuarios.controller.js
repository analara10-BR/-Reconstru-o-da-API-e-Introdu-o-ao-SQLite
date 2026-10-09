import UsuariosModel from "../models/usuarios.model.js";
import { handleSqliteError } from "./sqlite.errors.js";

export default class UsuariosController {
  constructor() {
    this.model = new UsuariosModel();
  }

  async getUsuarios(req, res, next) {
    try {
      res.status(200).json(this.model.findAll());
    } catch (error) {
      next(error);
    }
  }

  async getUsuarioById(req, res, next) {
    try {
      const usuario = this.model.findById(Number(req.params.id));
      if (!usuario) return res.status(404).json({ message: "Usuário não encontrado!" });
      res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async createUsuario(req, res, next) {
    try {
      const { nome, email } = req.body ?? {};
      if (typeof nome !== "string" || !nome.trim() || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ message: "Os campos 'nome' e 'email' (válido) são obrigatórios." });
      }
      res.status(201).json({ message: "Usuário cadastrado!", usuario: this.model.create(req.body) });
    } catch (error) {
      handleSqliteError(error, res, next);
    }
  }

  async deleteUsuario(req, res, next) {
    try {
      const usuario = this.model.remove(Number(req.params.id));
      if (!usuario) return res.status(404).json({ message: "Usuário não encontrado!" });
      res.status(200).json({ message: "Usuário deletado!", usuario });
    } catch (error) {
      next(error);
    }
  }
}
