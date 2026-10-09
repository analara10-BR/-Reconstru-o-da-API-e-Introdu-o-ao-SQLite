import { Router } from "express";
import ProdutosController from "../controllers/produtos.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";
import validateProduto from "../middlewares/validate.produto.middleware.js";

const router = Router();

const controller = new ProdutosController();

router.get("/produtos", (req, res, next) => controller.getProdutos(req, res, next));

router.get("/produtos/:produtoId", verifyParamId, (req, res, next) =>
  controller.getProdutoById(req, res, next),
);

router.post("/produtos", validateProduto(true), (req, res, next) =>
  controller.createProduto(req, res, next),
);

router.put("/produtos/:produtoId", verifyParamId, validateProduto(true), (req, res, next) =>
  controller.updateProduto(req, res, next),
);

router.patch("/produtos/:produtoId", verifyParamId, validateProduto(false), (req, res, next) =>
  controller.patchProduto(req, res, next),
);

router.delete("/produtos/:produtoId", verifyParamId, (req, res, next) =>
  controller.deleteProduto(req, res, next),
);

// Relacionamento N:N (produtos ↔ categorias)
router.post("/produtos/:produtoId/categorias/:categoriaId", verifyParamId, (req, res, next) =>
  controller.addCategoria(req, res, next),
);

router.delete("/produtos/:produtoId/categorias/:categoriaId", verifyParamId, (req, res, next) =>
  controller.removeCategoria(req, res, next),
);

export { router };
