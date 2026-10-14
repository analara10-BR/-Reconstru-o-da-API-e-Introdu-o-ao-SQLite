-- Scripts SQL para prática (podem ser executados na extensão "SQLite Viewer"/"SQLite" do VS Code
-- ou no terminal: sqlite3 src/databases/info.db < src/scripts/consultas.sql)

PRAGMA foreign_keys = ON;

-- READ: todos os produtos
SELECT * FROM produtos;

-- READ: produtos disponíveis com preço acima de R$ 70
SELECT nome, preco FROM produtos WHERE disponibilidade = 1 AND preco > 70 ORDER BY preco;

-- 1:N: produtos com o nome da marca
SELECT l.nome, a.nome AS marca
FROM produtos l
LEFT JOIN marcas a ON a.id = l.marca_id;

-- 1:1: produtos com Tamanho e condicao
SELECT l.nome, d.tamanho, d.condicao
FROM produtos l
INNER JOIN detalhes_produto d ON d.produto_id = l.id;

-- N:N: categorias de cada produto
SELECT l.nome, GROUP_CONCAT(c.nome, ', ') AS categorias
FROM produtos l
INNER JOIN produtos_categorias lc ON lc.produto_id = l.id
INNER JOIN categorias c ON c.id = lc.categoria_id
GROUP BY l.id;

-- Agregação: quantidade de produtos por categoria
SELECT c.nome, COUNT(lc.produto_id) AS total
FROM categorias c
LEFT JOIN produtos_categorias lc ON lc.categoria_id = c.id
GROUP BY c.id;

-- CREATE / UPDATE / DELETE (exemplos; descomente para executar)
-- INSERT INTO marcas (nome) VALUES ('Adidas');
-- UPDATE produtos SET disponibilidade = 1 WHERE id = 3;
-- DELETE FROM produtos_categorias WHERE produto_id = 1 AND categoria_id = 2;
