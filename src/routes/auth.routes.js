import { Router } from "express";
import AuthController from "../controllers/auth.controller.js";

const router = Router();

const controller = new AuthController();

// Rotas de autenticação (cadastro, login, logout e "quem sou eu")
router.post("/auth/cadastro", (req, res, next) => controller.cadastrar(req, res, next));
router.post("/auth/login", (req, res, next) => controller.login(req, res, next));
router.post("/auth/logout", (req, res, next) => controller.logout(req, res, next));
router.get("/auth/me", (req, res) => controller.me(req, res));

export { router };
