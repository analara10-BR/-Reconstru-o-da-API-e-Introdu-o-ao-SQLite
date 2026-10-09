import { Router } from "express";
import ApiController from "../controllers/api.controller.js";

const router = Router();
const controller = new ApiController();
router.get("/", (req, res) => controller.getStatus(req, res));
export { router };
