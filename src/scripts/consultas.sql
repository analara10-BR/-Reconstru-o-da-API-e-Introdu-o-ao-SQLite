-- Scripts SQL para prática (podem ser executados na extensão "SQLite Viewer"/"SQLite" do VS Code
-- ou no terminal: sqlite3 src/databases/info.db < src/scripts/consultas.sql)

PRAGMA foreign_keys = ON;

-- READ: todos os livros
SELECT * FROM livros;

-- READ: livros disponíveis publicados depois de 1900
SELECT titulo, ano FROM livros WHERE disponibilidade = 1 AND ano > 1900 ORDER BY ano;

-- 1:N: livros com o nome do autor
SELECT l.titulo, a.nome AS autor
FROM livros l
LEFT JOIN autores a ON a.id = l.autor_id;

-- 1:1: livros com ISBN e editora
SELECT l.titulo, d.isbn, d.editora
FROM livros l
INNER JOIN detalhes_livro d ON d.livro_id = l.id;

-- N:N: categorias de cada livro
SELECT l.titulo, GROUP_CONCAT(c.nome, ', ') AS categorias
FROM livros l
INNER JOIN livros_categorias lc ON lc.livro_id = l.id
INNER JOIN categorias c ON c.id = lc.categoria_id
GROUP BY l.id;

-- Agregação: quantidade de livros por categoria
SELECT c.nome, COUNT(lc.livro_id) AS total
FROM categorias c
LEFT JOIN livros_categorias lc ON lc.categoria_id = c.id
GROUP BY c.id;

-- CREATE / UPDATE / DELETE (exemplos; descomente para executar)
-- INSERT INTO autores (nome) VALUES ('Clarice Lispector');
-- UPDATE livros SET disponibilidade = 1 WHERE id = 3;
-- DELETE FROM livros_categorias WHERE livro_id = 1 AND categoria_id = 2;
