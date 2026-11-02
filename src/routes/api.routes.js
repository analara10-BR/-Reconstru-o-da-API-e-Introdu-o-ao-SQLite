import { Router } from "express";
import ApiController from "../controllers/api.controller.js";
import verifyParamId from "../middlewares/verify.id.middleware.js";

const router = Router();

const controller = new ApiController();

router.get("/info", (req, res) => controller.getInfo(req, res));

router.get("/info/:id", verifyParamId, (req, res, next) =>
  controller.getInfoByParamId(req, res, next),
);

router.get("/home", (req, res, next) => controller.getHome(req, res, next));

export { router };
