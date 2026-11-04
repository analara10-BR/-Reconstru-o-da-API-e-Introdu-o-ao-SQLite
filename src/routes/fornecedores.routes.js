import { Router } from "express";
import FornecedoresController from "../controllers/fornecedores.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";

const router = Router();

const controller = new FornecedoresController();

router.get("/fornecedores", (req, res, next) => controller.getFornecedores(req, res, next));
router.get("/fornecedores/:id", verifyParamId, (req, res, next) => controller.getFornecedorById(req, res, next));

export { router };
