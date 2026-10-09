import { createDatabase } from "../db_config/database.js";

const db = createDatabase("info.db");
const populate = db.transaction(() => {
  if (db.prepare("SELECT COUNT(*) AS total FROM livros").get().total > 0) {
    console.log("Banco já contém livros; carga inicial ignorada.");
    return;
  }

  const autor = db.prepare("INSERT INTO autores (nome) VALUES (?)");
  ["Machado de Assis", "George Orwell", "J. K. Rowling", "José de Alencar", "Clarice Lispector"].forEach((nome) => autor.run(nome));

  const categoria = db.prepare("INSERT INTO categorias (nome) VALUES (?)");
  ["Clássico", "Romance", "Ficção científica", "Fantasia", "Literatura brasileira"].forEach((nome) => categoria.run(nome));

  const livros = [
    ["Dom Casmurro", 1899, 1, 8, 1, "978-85-359-0277-5", "Globo", [1, 2, 5]],
    ["Memórias Póstumas de Brás Cubas", 1881, 1, 5, 1, "978-85-359-0278-2", "Globo", [1, 5]],
    ["1984", 1949, 0, 0, 2, "978-0-452-28423-4", "Secker & Warburg", [1, 3]],
    ["Harry Potter e a Pedra Filosofal", 1997, 1, 6, 3, "978-85-325-3050-1", "Rocco", [4]],
    ["Iracema", 1865, 1, 4, 4, null, "José Olympio", [1, 2, 5]],
    ["A Hora da Estrela", 1977, 1, 3, 5, null, "Rocco", [1, 5]]
  ];
  const insertLivro = db.prepare("INSERT INTO livros (titulo, ano, disponibilidade, exemplares, autor_id) VALUES (?, ?, ?, ?, ?)");
  const insertDetalhes = db.prepare("INSERT INTO detalhes_livro (livro_id, isbn, editora) VALUES (?, ?, ?)");
  const insertRel = db.prepare("INSERT INTO livros_categorias (livro_id, categoria_id) VALUES (?, ?)");
  for (const [titulo, ano, disponivel, exemplares, autorId, isbn, editora, categorias] of livros) {
    const id = Number(insertLivro.run(titulo, ano, disponivel, exemplares, autorId).lastInsertRowid);
    if (isbn || editora) insertDetalhes.run(id, isbn, editora);
    categorias.forEach((catId) => insertRel.run(id, catId));
  }
  const user = db.prepare("INSERT OR IGNORE INTO usuarios (nome, email, idade, altura, ativo, saldo) VALUES (?, ?, ?, ?, ?, ?)");
  user.run("Usuário Demonstração", "demo@example.com", 25, 1.70, 1, 0);
});
populate();
console.log("Banco populado com sucesso!");
db.close();
