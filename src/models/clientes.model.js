import db from "../db_config/connection.js";

export default class ClientesModel {
  // Busca usada no login: precisa do senha_hash para comparar a senha.
  // Esse objeto NUNCA é enviado para o navegador.
  findByEmailComSenha(email) {
    return db.prepare("SELECT * FROM cliente WHERE email = ?").get(email) ?? null;
  }

  // Versão segura (sem senha_hash) para usar no resto do sistema
  findById(id) {
    return db.prepare("SELECT id_cliente, nome, email, telefone FROM cliente WHERE id_cliente = ?").get(id) ?? null;
  }

  emailJaCadastrado(email) {
    return Boolean(db.prepare("SELECT 1 FROM cliente WHERE email = ?").get(email));
  }

  // INSERT do cadastro. Recebe a senha JÁ transformada em hash pelo controller.
  create({ nome, email, telefone, senhaHash }) {
    const result = db
      .prepare("INSERT INTO cliente (nome, email, telefone, senha_hash) VALUES (?, ?, ?, ?)")
      .run(nome, email, telefone, senhaHash);
    return this.findById(Number(result.lastInsertRowid));
  }
}
