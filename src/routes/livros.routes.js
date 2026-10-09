import { Router } from "express";
import LivrosController from "../controllers/livros.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";
import validateLivro from "../middlewares/validate.livro.middleware.js";

const router = Router();

const controller = new LivrosController();

router.get("/livros", (req, res, next) => controller.getLivros(req, res, next));

router.get("/livros/:livroId", verifyParamId, (req, res, next) =>
  controller.getLivroById(req, res, next),
);

router.post("/livros", validateLivro(true), (req, res, next) =>
  controller.createLivro(req, res, next),
);

router.put("/livros/:livroId", verifyParamId, validateLivro(true), (req, res, next) =>
  controller.updateLivro(req, res, next),
);

router.patch("/livros/:livroId", verifyParamId, validateLivro(false), (req, res, next) =>
  controller.patchLivro(req, res, next),
);

router.delete("/livros/:livroId", verifyParamId, (req, res, next) =>
  controller.deleteLivro(req, res, next),
);

// Relacionamento N:N (livros ↔ categorias)
router.post("/livros/:livroId/categorias/:categoriaId", verifyParamId, (req, res, next) =>
  controller.addCategoria(req, res, next),
);

router.delete("/livros/:livroId/categorias/:categoriaId", verifyParamId, (req, res, next) =>
  controller.removeCategoria(req, res, next),
);

export { router };
