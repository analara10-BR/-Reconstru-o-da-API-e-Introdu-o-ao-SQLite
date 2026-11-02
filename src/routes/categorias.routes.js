import { Router } from "express";
import CategoriasController from "../controllers/categorias.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";
import { exigirLogin } from "../middlewares/auth.middleware.js";

const router = Router();

const controller = new CategoriasController();

router.get("/categorias", (req, res, next) => controller.getCategorias(req, res, next));
router.get("/categorias/:id", verifyParamId, (req, res, next) => controller.getCategoriaById(req, res, next));
// Criar, alterar e excluir categorias exige login
router.post("/categorias", exigirLogin, (req, res, next) => controller.createCategoria(req, res, next));
router.put("/categorias/:id", exigirLogin, verifyParamId, (req, res, next) => controller.updateCategoria(req, res, next));
router.delete("/categorias/:id", exigirLogin, verifyParamId, (req, res, next) => controller.deleteCategoria(req, res, next));

export { router };
