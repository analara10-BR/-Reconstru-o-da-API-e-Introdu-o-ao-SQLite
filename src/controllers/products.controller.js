import ProdutosModel from "../models/produtos.model.js";

// Os "produtos" da loja/brecho são os produtos cadastrados no banco SQLite
const toProduct = (produto) => ({
  id: produto.id,
  nome: produto.nome,
  disponivel: produto.disponivel,
  preco: produto.preco,
  estoque: produto.estoque,
  marca: produto.marca,
  tamanho: produto.tamanho,
  condicao: produto.condicao,
  categorias: produto.categorias,
});

export default class ProductsController {
  constructor() {
    this.model = new ProdutosModel();
  }

  async getProducts(req, res, next) {
    try {
      const products = this.model.findAll().map(toProduct);
      res.json({ productsList: products });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params; // Captura o "id" da URL
      const produto = this.model.findById(Number(id)); // acesso ao BD

      if (!produto) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.json(toProduct(produto));
    } catch (error) {
      next(error);
    }
  }
}
