import { Router } from "express";
import PedidosController from "../controllers/pedidos.controller.js";
import { exigirLogin } from "../middlewares/auth.middleware.js";

const router = Router();
const controller = new PedidosController();
router.post("/pedidos", exigirLogin, (req, res, next) => controller.criar(req, res, next));
router.get("/pedidos/meus", exigirLogin, (req, res, next) => controller.meus(req, res, next));
export { router };
