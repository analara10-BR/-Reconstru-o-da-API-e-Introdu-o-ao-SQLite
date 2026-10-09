import { Router } from "express";
import BooksController from "../controllers/books.controller.js";
import { verifyIdMiddleware } from "../middlewares/verify.id.middleware.js";

export function createBooksRouter(db) {
  const router = Router();
  const controller = new BooksController(db);
  router.get("/livros", (req, res, next) => controller.list(req, res, next));
  router.get("/livros/:livroId", verifyIdMiddleware, (req, res, next) => controller.getById(req, res, next));
  router.post("/livros", (req, res, next) => controller.create(req, res, next));
  router.put("/livros/:livroId", verifyIdMiddleware, (req, res, next) => controller.replace(req, res, next));
  router.patch("/livros/:livroId", verifyIdMiddleware, (req, res, next) => controller.patch(req, res, next));
  router.delete("/livros/:livroId", verifyIdMiddleware, (req, res, next) => controller.delete(req, res, next));
  router.get("/autores", (req, res, next) => controller.authors(req, res, next));
  router.get("/categorias", (req, res, next) => controller.categories(req, res, next));
  return router;
}
