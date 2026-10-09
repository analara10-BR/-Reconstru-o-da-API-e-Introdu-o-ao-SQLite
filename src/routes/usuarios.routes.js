import { Router } from "express";
import UsuariosController from "../controllers/usuarios.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";

const router = Router();

const controller = new UsuariosController();

router.get("/usuarios", (req, res, next) => controller.getUsuarios(req, res, next));
router.get("/usuarios/:id", verifyParamId, (req, res, next) => controller.getUsuarioById(req, res, next));
router.post("/usuarios", (req, res, next) => controller.createUsuario(req, res, next));
router.delete("/usuarios/:id", verifyParamId, (req, res, next) => controller.deleteUsuario(req, res, next));

export { router };
