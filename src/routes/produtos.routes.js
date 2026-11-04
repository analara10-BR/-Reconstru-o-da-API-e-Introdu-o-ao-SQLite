import { Router } from "express";
import ProdutosController from "../controllers/produtos.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";
import validateProduto from "../middlewares/validate.produto.middleware.js";
import { exigirLogin } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new ProdutosController();

// Leitura é pública: qualquer pessoa pode ver o catálogo
router.get("/produtos", (req, res, next) => controller.getProdutos(req, res, next));

router.get("/produtos/:produtoId", verifyParamId, (req, res, next) =>
  controller.getProdutoById(req, res, next),
);

// Escrita é protegida: a ordem dos middlewares importa.
// 1º exigirLogin (está logada?) -> 2º validação dos dados -> 3º controller
router.post("/produtos", exigirLogin, validateProduto(true), (req, res, next) =>
  controller.createProduto(req, res, next),
);

router.put("/produtos/:produtoId", exigirLogin, verifyParamId, validateProduto(true), (req, res, next) =>
  controller.updateProduto(req, res, next),
);

router.patch("/produtos/:produtoId", exigirLogin, verifyParamId, validateProduto(false), (req, res, next) =>
  controller.patchProduto(req, res, next),
);

router.delete("/produtos/:produtoId", exigirLogin, verifyParamId, (req, res, next) =>
  controller.deleteProduto(req, res, next),
);

export { router };
