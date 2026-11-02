import { createDatabase } from "./database.js";

// Conexão única com o banco, compartilhada pelos models.
// O nome do arquivo pode ser trocado pela variável de ambiente DB_NAME (ex.: nos testes).
const db = createDatabase(process.env.DB_NAME || "info.db");

export default db;
