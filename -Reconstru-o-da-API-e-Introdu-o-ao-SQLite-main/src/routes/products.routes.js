import { Router } from "express";
import ProductsController from "../controllers/products.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";

const router = Router();

const controller = new ProductsController();

router.get("/products", (req, res, next) => controller.getProducts(req, res, next));

router.get("/products/:id", verifyParamId, (req, res, next) =>
  controller.getProductById(req, res, next),
);

export { router };
