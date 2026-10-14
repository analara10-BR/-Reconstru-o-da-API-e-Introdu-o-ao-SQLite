import db from "../db_config/connection.js";

// "foto" (BLOB) não é retornada na API
const COLUNAS = "id, nome, email, idade, altura, ativo, saldo, criado_em, ultimo_login";

const toUsuario = (row) =>
  row && {
    ...row,
    ativo: row.ativo === 1,
    ultimo_login_data: row.ultimo_login ? new Date(row.ultimo_login * 1000).toISOString() : null,
  };

export default class UsuariosModel {
  findAll() {
    return db.prepare(`SELECT ${COLUNAS} FROM usuarios ORDER BY id`).all().map(toUsuario);
  }

  findById(id) {
    return toUsuario(db.prepare(`SELECT ${COLUNAS} FROM usuarios WHERE id = ?`).get(id)) ?? null;
  }

  create({ nome, email, idade = null, altura = null, ativo = true, saldo = 0 }) {
    const result = db
      .prepare(
        `
        INSERT INTO usuarios (nome, email, idade, altura, ativo, saldo, ultimo_login)
        VALUES (?, ?, ?, ?, ?, ?, strftime('%s','now'))
        `,
      )
      .run(nome.trim(), email.trim(), idade, altura, ativo ? 1 : 0, saldo);
    return this.findById(Number(result.lastInsertRowid));
  }

  remove(id) {
    const usuario = this.findById(id);
    if (!usuario) return null;
    db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
    return usuario;
  }
}
