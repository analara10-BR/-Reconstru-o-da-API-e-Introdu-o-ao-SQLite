import ProdutosModel from "../models/produtos.model.js";

// Formato usado pelas páginas do catálogo (cards, filtros e detalhes).
// pode_editar = true somente para quem anunciou a peça (usado para mostrar o formulário de edição).
const toProduct = (produto, cliente) => ({
  id: produto.id_produto,
  nome: produto.nome,
  descricao: produto.descricao,
  tamanho: produto.tamanho,
  preco: produto.preco,
  estado_conservacao: produto.estado_conservacao,
  disponivel: produto.disponibilidade,
  imagem_url: produto.imagem_url,
  id_categoria: produto.id_categoria,
  categoria: produto.categoria,
  fornecedor: produto.fornecedor,
  pode_editar: Boolean(cliente) && produto.id_cliente_anunciante === cliente.id_cliente,
});

export default class ProductsController {
  constructor() {
    this.model = new ProdutosModel();
  }

  async getProducts(req, res, next) {
    try {
      const products = this.model.findAll().map((p) => toProduct(p, req.cliente));
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

      res.json(toProduct(produto, req.cliente));
    } catch (error) {
      next(error);
    }
  }
}
