import { Router } from "express";
import AutoresController from "../controllers/autores.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";

const router = Router();

const controller = new AutoresController();

router.get("/autores", (req, res, next) => controller.getAutores(req, res, next));
router.get("/autores/:id", verifyParamId, (req, res, next) => controller.getAutorById(req, res, next));
router.post("/autores", (req, res, next) => controller.createAutor(req, res, next));
router.put("/autores/:id", verifyParamId, (req, res, next) => controller.updateAutor(req, res, next));
router.delete("/autores/:id", verifyParamId, (req, res, next) => controller.deleteAutor(req, res, next));

export { router };
