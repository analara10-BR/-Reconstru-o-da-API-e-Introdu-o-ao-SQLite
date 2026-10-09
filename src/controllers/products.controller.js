import LivrosModel from "../models/livros.model.js";

// Os "produtos" da loja/biblioteca são os livros cadastrados no banco SQLite
const toProduct = (livro) => ({
  id: livro.id,
  nome: livro.titulo,
  disponivel: livro.disponivel,
  ano: livro.ano,
  exemplares: livro.exemplares,
  autor: livro.autor,
  isbn: livro.isbn,
  editora: livro.editora,
  categorias: livro.categorias,
});

export default class ProductsController {
  constructor() {
    this.model = new LivrosModel();
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
      const livro = this.model.findById(Number(id)); // acesso ao BD

      if (!livro) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      res.json(toProduct(livro));
    } catch (error) {
      next(error);
    }
  }
}
