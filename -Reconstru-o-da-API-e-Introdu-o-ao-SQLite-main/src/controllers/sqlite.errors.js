// Converte erros de restrição do SQLite (FOREIGN KEY, UNIQUE, CHECK) em respostas 400
export const handleSqliteError = (error, res, next) => {
  const code = String(error.code || "");
  if (code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
    return res.status(400).json({ message: "Relacionamento inválido: marca ou categoria informada não existe.", error: error.message });
  }
  if (code === "SQLITE_CONSTRAINT_UNIQUE" || code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
    return res.status(400).json({ message: "Registro duplicado.", error: error.message });
  }
  if (code.startsWith("SQLITE_CONSTRAINT")) {
    return res.status(400).json({ message: "Dados inválidos para o banco de dados.", error: error.message });
  }
  next(error);
};
