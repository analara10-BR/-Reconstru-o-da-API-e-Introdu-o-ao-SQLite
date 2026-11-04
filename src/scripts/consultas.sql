-- Scripts SQL para prática (podem ser executados na extensão "SQLite Viewer"/"SQLite" do VS Code
-- ou no terminal: sqlite3 src/databases/info.db < src/scripts/consultas.sql)

-- Liga a verificação das chaves estrangeiras (no SQLite ela vem desligada por padrão)
PRAGMA foreign_keys = ON;
PRAGMA foreign_keys;               -- deve mostrar 1

-- Estrutura: colunas e FKs de uma tabela
PRAGMA table_info(produto);
PRAGMA foreign_key_list(produto);
PRAGMA foreign_key_check;          -- vazio = nenhuma FK quebrada

-- READ: todos os produtos
SELECT * FROM produto;

-- READ com WHERE: produtos disponíveis com preço acima de R$ 70
SELECT nome, preco FROM produto WHERE disponibilidade = 1 AND preco > 70 ORDER BY preco;

-- 1:N: produtos com categoria e fornecedor
SELECT p.nome, c.nome AS categoria, f.nome AS fornecedor
FROM produto p
INNER JOIN categoria c  ON c.id_categoria  = p.id_categoria
INNER JOIN fornecedor f ON f.id_fornecedor = p.id_fornecedor;

-- Peças anunciadas por cada cliente (cliente -> fornecedor -> produto)
SELECT cl.nome AS anunciante, p.nome AS peca, p.preco
FROM cliente cl
INNER JOIN fornecedor f ON f.id_cliente   = cl.id_cliente
INNER JOIN produto p    ON p.id_fornecedor = f.id_fornecedor;

-- N:N: produtos de cada pedido (através da tabela associativa item_pedido)
SELECT pe.id_pedido, cl.nome AS cliente, pr.nome AS produto, i.quantidade, i.preco_unitario
FROM pedido pe
INNER JOIN cliente cl    ON cl.id_cliente = pe.id_cliente
INNER JOIN item_pedido i ON i.id_pedido   = pe.id_pedido
INNER JOIN produto pr    ON pr.id_produto = i.id_produto;

-- 1:0..1: pedidos e sua entrega (LEFT JOIN mostra também quem ainda não tem entrega)
SELECT pe.id_pedido, pe.status, e.situacao, e.rastreamento
FROM pedido pe
LEFT JOIN entrega e ON e.id_pedido = pe.id_pedido;

-- Cupom opcional: pedidos com e sem cupom
SELECT id_pedido, valor_total, COALESCE(codigo_cupom, 'sem cupom') AS cupom FROM pedido;

-- Agregação: quantidade de produtos por categoria
SELECT c.nome, COUNT(p.id_produto) AS total
FROM categoria c
LEFT JOIN produto p ON p.id_categoria = c.id_categoria
GROUP BY c.id_categoria;

-- Dados da versão antiga preservados pela migração (só existem se o banco foi migrado)
-- SELECT * FROM legado_produtos;
-- SELECT * FROM legado_marcas;

-- CREATE / UPDATE / DELETE (exemplos; descomente para executar)
-- INSERT INTO categoria (nome, descricao) VALUES ('Acessórios', 'Bolsas, cintos e bijuterias');
-- UPDATE produto SET disponibilidade = 1 WHERE id_produto = 3;
-- DELETE FROM produto WHERE id_produto = 999;
-- Teste da FK (deve dar erro "FOREIGN KEY constraint failed"):
-- INSERT INTO produto (nome, preco, id_categoria, id_fornecedor) VALUES ('Teste', 10, 999, 1);
