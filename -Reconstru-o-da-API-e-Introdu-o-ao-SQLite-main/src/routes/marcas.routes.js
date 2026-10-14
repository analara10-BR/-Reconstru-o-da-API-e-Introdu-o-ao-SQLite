import { Router } from "express";
import MarcasController from "../controllers/marcas.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";

const router = Router();

const controller = new MarcasController();

router.get("/marcas", (req, res, next) => controller.getMarcas(req, res, next));
router.get("/marcas/:id", verifyParamId, (req, res, next) => controller.getMarcaById(req, res, next));
router.post("/marcas", (req, res, next) => controller.createMarca(req, res, next));
router.put("/marcas/:id", verifyParamId, (req, res, next) => controller.updateMarca(req, res, next));
router.delete("/marcas/:id", verifyParamId, (req, res, next) => controller.deleteMarca(req, res, next));

export { router };
